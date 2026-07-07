import { BadRequestException, Injectable } from '@nestjs/common';
import { ContextBuilder } from './context/context.builder';
import { RrfFusion } from './fusion/rrf.fusion';
import { GraphRetriever } from './retrievers/graph.retriever';
import { KeywordRetriever } from './retrievers/keyword.retriever';
import { VectorRetriever } from './retrievers/vector.retriever';
import { RerankerService } from '../reranker';
import {
  MAX_CONTEXT_TOKENS,
  type ContextChunk,
  defaultRetrievalLimit,
  defaultRetrieverCandidateLimit,
  type KnowledgeRequestContext,
  type RetrievalRequest,
} from './retrieval.types';

@Injectable()
export class RetrievalService {
  constructor(
    private readonly contextBuilder: ContextBuilder,
    private readonly graphRetriever: GraphRetriever,
    private readonly keywordRetriever: KeywordRetriever,
    private readonly rerankerService: RerankerService,
    private readonly rrfFusion: RrfFusion,
    private readonly vectorRetriever: VectorRetriever,
  ) {}

  async retrieve(
    context: KnowledgeRequestContext,
    request: RetrievalRequest,
  ): Promise<ContextChunk[]> {
    const query = request.query.trim();

    if (!query) {
      throw new BadRequestException('Retrieval query is required');
    }

    const accessContext = this.contextBuilder.build(context);

    if (!accessContext.canRetrieve) {
      return [];
    }

    const resultLimit = this.resolveLimit(request.limit, defaultRetrievalLimit);
    const vectorLimit = this.resolveLimit(request.vectorLimit, defaultRetrieverCandidateLimit);
    const keywordLimit = this.resolveLimit(request.keywordLimit, defaultRetrieverCandidateLimit);
    const contextTokenBudget = this.resolveLimit(request.maxContextTokens, MAX_CONTEXT_TOKENS);
    const [vectorResults, keywordResults, graphResults] = await Promise.all([
      this.vectorRetriever.retrieve(query, accessContext, vectorLimit),
      this.keywordRetriever.retrieve(query, accessContext, keywordLimit),
      this.graphRetriever.retrieve(query, accessContext, keywordLimit),
    ]);
    const rrfResults = this.rrfFusion.fuse(
      [vectorResults, keywordResults, graphResults],
      resultLimit,
    );
    const rerankedResults = await this.rerankerService.rerank(query, rrfResults);

    return this.contextBuilder.buildContextChunks(rerankedResults, contextTokenBudget);
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
}
