import { BadRequestException, Injectable } from '@nestjs/common';
import { ObservabilityService } from '../../infrastructure/observability';
import { ContextBuilder } from './context/context.builder';
import { RrfFusion } from './fusion/rrf.fusion';
import { GraphRetriever } from './retrievers/graph.retriever';
import { KeywordRetriever } from './retrievers/keyword.retriever';
import { VectorRetriever } from './retrievers/vector.retriever';
import { AccessPolicyService, type KnowledgeResourceMetadata } from '../access-policy';
import { DocumentRepository } from '../document';
import type { KnowledgeSpaceEntity, SpaceMemberRole } from '../knowledge-space';
import { KnowledgeSpaceService } from '../knowledge-space';
import { RerankerService } from '../reranker';
import {
  MAX_CONTEXT_TOKENS,
  type ContextChunk,
  defaultRetrievalLimit,
  defaultRetrieverCandidateLimit,
  type KnowledgeRequestContext,
  type RetrievalRequest,
  type RetrieverResult,
} from './retrieval.types';

const unique = (values: string[]): string[] => [...new Set(values.filter(Boolean))];

interface TenantScopedRetrievalContext {
  context: KnowledgeRequestContext;
  spaceRolesById: Record<string, SpaceMemberRole | undefined>;
  spaceTenantIdsById: Record<string, string | null | undefined>;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly accessPolicyService: AccessPolicyService,
    private readonly contextBuilder: ContextBuilder,
    private readonly documentRepository: DocumentRepository,
    private readonly graphRetriever: GraphRetriever,
    private readonly knowledgeSpaceService: KnowledgeSpaceService,
    private readonly keywordRetriever: KeywordRetriever,
    private readonly observabilityService: ObservabilityService,
    private readonly rerankerService: RerankerService,
    private readonly rrfFusion: RrfFusion,
    private readonly vectorRetriever: VectorRetriever,
  ) {}

  async retrieve(
    context: KnowledgeRequestContext,
    request: RetrievalRequest,
  ): Promise<ContextChunk[]> {
    const startedAt = Date.now();
    let scopedContext = context;

    try {
      const query = request.query.trim();

      if (!query) {
        throw new BadRequestException('Retrieval query is required');
      }

      const scoped = await this.createTenantScopedContext(context);
      scopedContext = scoped.context;
      const accessContext = this.contextBuilder.build(scopedContext);

      if (!accessContext.canRetrieve) {
        this.observabilityService.recordRetrieval({
          context: scopedContext,
          durationMs: Date.now() - startedAt,
          resultCount: 0,
          source: 'hybrid',
          status: 'success',
        });
        return [];
      }

      const resultLimit = this.resolveLimit(request.limit, defaultRetrievalLimit);
      const vectorLimit = this.resolveLimit(request.vectorLimit, defaultRetrieverCandidateLimit);
      const keywordLimit = this.resolveLimit(request.keywordLimit, defaultRetrieverCandidateLimit);
      const contextTokenBudget = this.resolveLimit(request.maxContextTokens, MAX_CONTEXT_TOKENS);
      const [vectorResults, keywordResults, graphResults] = await Promise.all([
        this.vectorRetriever.retrieve(query, accessContext, vectorLimit),
        this.keywordRetriever.retrieve(query, accessContext, keywordLimit),
        request.enableGraph === false
          ? Promise.resolve([])
          : this.graphRetriever.retrieve(query, accessContext, keywordLimit),
      ]);
      const documentMetadataById = await this.loadDocumentMetadataById([
        ...vectorResults,
        ...keywordResults,
        ...graphResults,
      ]);
      const filteredResultSets = [vectorResults, keywordResults, graphResults].map((results) =>
        this.accessPolicyService.filterRetrievalResults(
          this.accessPolicyService.toSubject(scopedContext),
          results,
          {
            documentMetadataById,
            spaceRolesById: scoped.spaceRolesById,
            spaceTenantIdsById: scoped.spaceTenantIdsById,
          },
        ),
      );
      const rrfResults = this.rrfFusion.fuse(filteredResultSets, resultLimit);
      const rerankedResults = await this.rerankerService.rerank(query, rrfResults);
      const contextChunks = this.contextBuilder.buildContextChunks(
        rerankedResults,
        contextTokenBudget,
      );

      this.observabilityService.recordRetrieval({
        context: scopedContext,
        durationMs: Date.now() - startedAt,
        resultCount: contextChunks.length,
        source: 'hybrid',
        status: 'success',
      });

      return contextChunks;
    } catch (error) {
      this.observabilityService.recordRetrieval({
        context: scopedContext,
        durationMs: Date.now() - startedAt,
        error,
        resultCount: 0,
        source: 'hybrid',
        status: 'failed',
      });
      throw error;
    }
  }

  private resolveLimit(value: number | undefined, fallback: number): number {
    if (value === undefined) {
      return fallback;
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException('Retrieval limit must be a positive integer');
    }

    return value;
  }

  private async createTenantScopedContext(
    context: KnowledgeRequestContext,
  ): Promise<TenantScopedRetrievalContext> {
    const spaces = await this.knowledgeSpaceService.list(context);
    const requestedSpaceIds = unique(context.spaceIds);
    const requestedSpaceIdSet = new Set(requestedSpaceIds);
    const selectedSpaces =
      requestedSpaceIds.length === 0
        ? spaces
        : spaces.filter((space) => requestedSpaceIdSet.has(space.id));

    return {
      context: {
        ...context,
        spaceIds: selectedSpaces.map((space) => space.id),
      },
      spaceRolesById: this.toSpaceRolesById(selectedSpaces, context.userId),
      spaceTenantIdsById: Object.fromEntries(
        selectedSpaces.map((space) => [space.id, space.tenantId]),
      ),
    };
  }

  private async loadDocumentMetadataById(
    results: RetrieverResult[],
  ): Promise<Record<string, KnowledgeResourceMetadata | undefined>> {
    const documentIds = unique(results.map((result) => result.documentId));
    const contents = await this.documentRepository.findContentsByDocumentIds(documentIds);

    return Object.fromEntries(
      contents.map((content) => [
        content.documentId,
        {
          allowedDepartmentIds: content.metadata.allowedDepartmentIds,
          departmentId: content.metadata.departmentId,
          securityLevel: content.metadata.securityLevel,
          spaceId: content.metadata.spaceId,
        },
      ]),
    );
  }

  private toSpaceRolesById(
    spaces: KnowledgeSpaceEntity[],
    userId: string,
  ): Record<string, SpaceMemberRole | undefined> {
    return Object.fromEntries(
      spaces.map((space) => [
        space.id,
        space.members.find((member) => member.userId === userId)?.role,
      ]),
    );
  }
}
