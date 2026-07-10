import { BadRequestException, Injectable } from '@nestjs/common';
import { ObservabilityService } from '../../infrastructure/observability';
import { ContextBuilder } from './context/context.builder';
import { RrfFusion } from './fusion/rrf.fusion';
import { GraphRetriever } from './retrievers/graph.retriever';
import { KeywordRetriever } from './retrievers/keyword.retriever';
import { VectorRetriever } from './retrievers/vector.retriever';
import { AccessPolicyService, type KnowledgeResourceMetadata } from '../access-policy';
import { ChunkRepository, type ChunkEntity } from '../chunk';
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
  type RetrievalPipelineBreakdown,
  type RetrievalPipelineResult,
  type RetrievalPipelineStage,
  type RetrievalStageBreakdown,
  type RetrievalRequest,
  type RetrievalResult,
  type RetrieverResult,
} from './retrieval.types';

const unique = (values: string[]): string[] => [...new Set(values.filter(Boolean))];
const completeDocumentQueryPattern =
  /(完整|全部|所有|全文|整份|整篇|详细|简历|履历|档案|complete|full|entire|resume|cv)/i;

interface TenantScopedRetrievalContext {
  context: KnowledgeRequestContext;
  spaceRolesById: Record<string, SpaceMemberRole | undefined>;
  spaceTenantIdsById: Record<string, string | null | undefined>;
}

interface RetrievalStageOutcome<T> {
  breakdown: RetrievalStageBreakdown;
  error?: unknown;
  result: T;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly accessPolicyService: AccessPolicyService,
    private readonly chunkRepository: ChunkRepository,
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
    return (await this.retrieveWithBreakdown(context, request)).chunks;
  }

  async retrieveWithBreakdown(
    context: KnowledgeRequestContext,
    request: RetrievalRequest,
  ): Promise<RetrievalPipelineResult> {
    const startedAt = Date.now();
    let scopedContext = context;
    let stages: RetrievalStageBreakdown[] = [];

    try {
      const query = request.query.trim();

      if (!query) {
        throw new BadRequestException('Retrieval query is required');
      }

      const scoped = await this.createTenantScopedContext(context);
      scopedContext = scoped.context;
      const accessContext = this.contextBuilder.build(scopedContext);

      if (!accessContext.canRetrieve) {
        stages = this.createSkippedBreakdown('no-retrieval-access');
        this.observabilityService.recordRetrieval({
          context: scopedContext,
          durationMs: Date.now() - startedAt,
          resultCount: 0,
          source: 'hybrid',
          status: 'success',
        });
        return {
          breakdown: this.createBreakdown(
            stages,
            scopedContext.spaceIds.length,
            Date.now() - startedAt,
          ),
          chunks: [],
        };
      }

      const resultLimit = this.resolveLimit(request.limit, defaultRetrievalLimit);
      const vectorLimit = this.resolveLimit(request.vectorLimit, defaultRetrieverCandidateLimit);
      const keywordLimit = this.resolveLimit(request.keywordLimit, defaultRetrieverCandidateLimit);
      const contextTokenBudget = this.resolveLimit(request.maxContextTokens, MAX_CONTEXT_TOKENS);
      const [vectorStage, keywordStage, graphStage] = await Promise.all([
        this.runRetrieverStage('vector', vectorLimit, () =>
          this.vectorRetriever.retrieve(query, accessContext, vectorLimit),
        ),
        this.runRetrieverStage('keyword', keywordLimit, () =>
          this.keywordRetriever.retrieve(query, accessContext, keywordLimit),
        ),
        request.enableGraph === false
          ? Promise.resolve(this.skipRetrieverStage('graph', 'enableGraph=false', keywordLimit))
          : this.runRetrieverStage('graph', keywordLimit, () =>
              this.graphRetriever.retrieve(query, accessContext, keywordLimit),
            ),
      ]);

      stages.push(vectorStage.breakdown, keywordStage.breakdown, graphStage.breakdown);
      this.throwFirstStageError([vectorStage, keywordStage, graphStage]);

      const vectorResults = vectorStage.result;
      const keywordResults = keywordStage.result;
      const graphResults = graphStage.result;
      const permissionStage = await this.runPipelineStage(
        'permission-filter',
        vectorResults.length + keywordResults.length + graphResults.length,
        async () => {
          const documentMetadataById = await this.loadDocumentMetadataById([
            ...vectorResults,
            ...keywordResults,
            ...graphResults,
          ]);

          return [vectorResults, keywordResults, graphResults].map((results) =>
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
        },
      );

      stages.push(permissionStage.breakdown);
      this.throwFirstStageError([permissionStage]);
      const filteredResultSets = permissionStage.result;
      const filteredCount = this.countResults(filteredResultSets);
      const rrfStage = await this.runPipelineStage('rrf', filteredCount, () =>
        this.rrfFusion.fuse(filteredResultSets, resultLimit),
      );

      stages.push(rrfStage.breakdown);
      this.throwFirstStageError([rrfStage]);
      const rrfResults = rrfStage.result;
      const rerankerStage = await this.runPipelineStage('reranker', rrfResults.length, () =>
        this.rerankerService.rerank(query, rrfResults),
      );

      stages.push(rerankerStage.breakdown);
      this.throwFirstStageError([rerankerStage]);
      const rerankedResults = rerankerStage.result;
      const expandedResults = await this.expandCompleteDocumentResults(query, rerankedResults);
      const contextStage = await this.runPipelineStage(
        'context-builder',
        expandedResults.length,
        () => this.contextBuilder.buildContextChunks(expandedResults, contextTokenBudget),
      );

      stages.push(contextStage.breakdown);
      this.throwFirstStageError([contextStage]);
      const contextChunks = contextStage.result;

      this.observabilityService.recordRetrieval({
        context: scopedContext,
        durationMs: Date.now() - startedAt,
        resultCount: contextChunks.length,
        source: 'hybrid',
        status: 'success',
      });

      return {
        breakdown: this.createBreakdown(
          stages,
          scopedContext.spaceIds.length,
          Date.now() - startedAt,
        ),
        chunks: contextChunks,
      };
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

  private async expandCompleteDocumentResults(
    query: string,
    results: RetrievalResult[],
  ): Promise<RetrievalResult[]> {
    if (!completeDocumentQueryPattern.test(query) || results.length === 0) {
      return results;
    }

    const documentId = this.selectDominantDocumentId(results);

    if (!documentId) {
      return results;
    }

    const documentChunks = await this.chunkRepository.listByDocumentIds([documentId]);

    if (documentChunks.length === 0) {
      return results;
    }

    const maxScore = this.getMaxDocumentScore(results, documentId);
    const expandedResults = documentChunks.map((chunk) =>
      this.toExpandedRetrievalResult(chunk, maxScore),
    );
    const expandedChunkIds = new Set(expandedResults.map((result) => result.chunkId));

    return [
      ...expandedResults,
      ...results.filter(
        (result) => result.documentId === documentId && !expandedChunkIds.has(result.chunkId),
      ),
    ];
  }

  private selectDominantDocumentId(results: RetrievalResult[]): string | null {
    const documentScores = new Map<string, { count: number; maxScore: number; firstIndex: number }>();

    results.forEach((result, index) => {
      const existing = documentScores.get(result.documentId);

      if (!existing) {
        documentScores.set(result.documentId, {
          count: 1,
          firstIndex: index,
          maxScore: result.score,
        });
        return;
      }

      existing.count += 1;
      existing.maxScore = Math.max(existing.maxScore, result.score);
    });

    const [selected] = [...documentScores.entries()].sort((left, right) => {
      const countDelta = right[1].count - left[1].count;

      if (countDelta !== 0) {
        return countDelta;
      }

      const scoreDelta = right[1].maxScore - left[1].maxScore;

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left[1].firstIndex - right[1].firstIndex;
    });

    return selected?.[0] ?? null;
  }

  private getMaxDocumentScore(results: RetrievalResult[], documentId: string): number {
    return Math.max(
      ...results
        .filter((result) => result.documentId === documentId)
        .map((result) => result.score),
      0,
    );
  }

  private toExpandedRetrievalResult(chunk: ChunkEntity, score: number): RetrievalResult {
    return {
      chunkId: chunk.id,
      content: chunk.content,
      documentId: chunk.documentId,
      metadata: chunk.metadata,
      score,
    };
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

  private countResults(resultSets: RetrieverResult[][]): number {
    return resultSets.reduce((count, results) => count + results.length, 0);
  }

  private createBreakdown(
    stages: RetrievalStageBreakdown[],
    scopedSpaceCount: number,
    totalDurationMs: number,
  ): RetrievalPipelineBreakdown {
    return {
      contextCount: this.findStageOutputCount(stages, 'context-builder'),
      filteredCount: this.findStageOutputCount(stages, 'permission-filter'),
      graphCount: this.findStageOutputCount(stages, 'graph'),
      keywordCount: this.findStageOutputCount(stages, 'keyword'),
      rerankedCount: this.findStageOutputCount(stages, 'reranker'),
      rrfCount: this.findStageOutputCount(stages, 'rrf'),
      scopedSpaceCount,
      stages,
      totalDurationMs,
      vectorCount: this.findStageOutputCount(stages, 'vector'),
    };
  }

  private createSkippedBreakdown(reason: string): RetrievalStageBreakdown[] {
    return [
      'vector',
      'keyword',
      'graph',
      'permission-filter',
      'rrf',
      'reranker',
      'context-builder',
    ].map((stage) => ({
      durationMs: 0,
      outputCount: 0,
      reason,
      stage: stage as RetrievalPipelineStage,
      status: 'skipped',
    }));
  }

  private findStageOutputCount(
    stages: RetrievalStageBreakdown[],
    stage: RetrievalPipelineStage,
  ): number {
    return stages.find((item) => item.stage === stage)?.outputCount ?? 0;
  }

  private async runPipelineStage<
    T extends RetrievalResult[] | RetrieverResult[][] | ContextChunk[],
  >(
    stage: RetrievalPipelineStage,
    inputCount: number,
    action: () => Promise<T> | T,
  ): Promise<RetrievalStageOutcome<T>> {
    const startedAt = Date.now();

    try {
      const result = await action();

      return {
        breakdown: {
          durationMs: Date.now() - startedAt,
          inputCount,
          outputCount: Array.isArray(result[0])
            ? this.countResults(result as RetrieverResult[][])
            : result.length,
          stage,
          status: 'success',
        },
        result,
      };
    } catch (error) {
      return {
        breakdown: {
          durationMs: Date.now() - startedAt,
          inputCount,
          outputCount: 0,
          stage,
          status: 'failed',
        },
        error,
        result: [] as unknown as T,
      };
    }
  }

  private async runRetrieverStage(
    stage: Extract<RetrievalPipelineStage, 'graph' | 'keyword' | 'vector'>,
    limit: number,
    action: () => Promise<RetrieverResult[]>,
  ): Promise<RetrievalStageOutcome<RetrieverResult[]>> {
    return this.runPipelineStage(stage, limit, action);
  }

  private skipRetrieverStage(
    stage: Extract<RetrievalPipelineStage, 'graph' | 'keyword' | 'vector'>,
    reason: string,
    limit: number,
  ): RetrievalStageOutcome<RetrieverResult[]> {
    return {
      breakdown: {
        durationMs: 0,
        inputCount: limit,
        outputCount: 0,
        reason,
        stage,
        status: 'skipped',
      },
      result: [],
    };
  }

  private throwFirstStageError(stages: Array<RetrievalStageOutcome<unknown>>): void {
    const failedStage = stages.find((stage) => stage.error);

    if (failedStage) {
      throw failedStage.error;
    }
  }
}
