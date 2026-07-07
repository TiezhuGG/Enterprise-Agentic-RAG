import { Inject, Injectable } from '@nestjs/common';
import type { RetrievalResult } from '../retrieval';
import { RERANKER_PROVIDER, type RerankerProvider } from './providers/reranker.provider';
import type { RerankDocument, RerankResult } from './reranker.types';

@Injectable()
export class RerankerService {
  constructor(
    @Inject(RERANKER_PROVIDER)
    private readonly rerankerProvider: RerankerProvider,
  ) {}

  async rerank(query: string, results: RetrievalResult[]): Promise<RerankResult[]> {
    if (results.length === 0) {
      return [];
    }

    const documents = this.toRerankDocuments(results);
    const scores = await this.rerankerProvider.rerank(query, documents);
    const scoreByChunkId = new Map(scores.map((score) => [score.chunkId, score.score]));

    return documents
      .map((document) => ({
        chunkId: document.chunkId,
        documentId: document.documentId,
        content: document.content,
        score: scoreByChunkId.get(document.chunkId) ?? document.score,
        metadata: document.metadata,
      }))
      .sort((left, right) => right.score - left.score);
  }

  private toRerankDocuments(results: RetrievalResult[]): RerankDocument[] {
    return results.map((result) => ({
      chunkId: result.chunkId,
      documentId: result.documentId,
      content: result.content,
      score: result.score,
      metadata: result.metadata,
    }));
  }
}
