import { BadRequestException, Injectable } from '@nestjs/common';
import { ContextBuilder } from './context/context.builder';
import { RrfFusion } from './fusion/rrf.fusion';
import { KeywordRetriever } from './retrievers/keyword.retriever';
import { VectorRetriever } from './retrievers/vector.retriever';
import {
  defaultRetrievalLimit,
  defaultRetrieverCandidateLimit,
  type KnowledgeRequestContext,
  type RetrievalRequest,
  type RetrievalResult,
} from './retrieval.types';

@Injectable()
export class RetrievalService {
  constructor(
    private readonly contextBuilder: ContextBuilder,
    private readonly keywordRetriever: KeywordRetriever,
    private readonly rrfFusion: RrfFusion,
    private readonly vectorRetriever: VectorRetriever,
  ) {}

  async retrieve(
    context: KnowledgeRequestContext,
    request: RetrievalRequest,
  ): Promise<RetrievalResult[]> {
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
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorRetriever.retrieve(query, accessContext, vectorLimit),
      this.keywordRetriever.retrieve(query, accessContext, keywordLimit),
    ]);

    return this.rrfFusion.fuse([vectorResults, keywordResults], resultLimit);
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
