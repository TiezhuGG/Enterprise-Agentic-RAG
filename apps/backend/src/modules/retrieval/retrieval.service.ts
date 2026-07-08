import { BadRequestException, Injectable } from '@nestjs/common';
import { ObservabilityService } from '../../infrastructure/observability';
import { ContextBuilder } from './context/context.builder';
import { RrfFusion } from './fusion/rrf.fusion';
import { GraphRetriever } from './retrievers/graph.retriever';
import { KeywordRetriever } from './retrievers/keyword.retriever';
import { VectorRetriever } from './retrievers/vector.retriever';
import { KnowledgeSpaceService } from '../knowledge-space';
import { RerankerService } from '../reranker';
import {
  MAX_CONTEXT_TOKENS,
  type ContextChunk,
  defaultRetrievalLimit,
  defaultRetrieverCandidateLimit,
  type KnowledgeRequestContext,
  type RetrievalRequest,
} from './retrieval.types';

const unique = (values: string[]): string[] => [...new Set(values.filter(Boolean))];

@Injectable()
export class RetrievalService {
  constructor(
    private readonly contextBuilder: ContextBuilder,
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

      scopedContext = await this.createTenantScopedContext(context);
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
      const rrfResults = this.rrfFusion.fuse(
        [vectorResults, keywordResults, graphResults],
        resultLimit,
      );
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
  ): Promise<KnowledgeRequestContext> {
    const accessibleSpaceIds = await this.knowledgeSpaceService.listAccessibleSpaceIds(context);
    const requestedSpaceIds = unique(context.spaceIds);
    const requestedSpaceIdSet = new Set(requestedSpaceIds);
    const spaceIds =
      requestedSpaceIds.length === 0
        ? accessibleSpaceIds
        : accessibleSpaceIds.filter((spaceId) => requestedSpaceIdSet.has(spaceId));

    return {
      ...context,
      spaceIds,
    };
  }
}
