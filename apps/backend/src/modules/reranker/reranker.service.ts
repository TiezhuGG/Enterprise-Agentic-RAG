import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '../../config';
import { ObservabilityService } from '../../infrastructure/observability';
import type { RetrievalResult } from '../retrieval';
import { RERANKER_PROVIDER, type RerankerProvider } from './providers/reranker.provider';
import type { RerankDocument, RerankResult } from './reranker.types';

@Injectable()
export class RerankerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
    @Inject(RERANKER_PROVIDER)
    private readonly rerankerProvider: RerankerProvider,
  ) {}

  async rerank(query: string, results: RetrievalResult[]): Promise<RerankResult[]> {
    const startedAt = Date.now();
    const { model } = this.configService.getRerankerConfig();

    if (results.length === 0) {
      this.observabilityService.recordReranker({
        documentCount: 0,
        durationMs: Date.now() - startedAt,
        model,
        operation: 'rerank',
        status: 'skipped',
      });
      return [];
    }

    try {
      const documents = this.toRerankDocuments(results);
      const scores = await this.rerankerProvider.rerank(query, documents);
      const scoreByChunkId = new Map(scores.map((score) => [score.chunkId, score.score]));

      this.observabilityService.recordReranker({
        documentCount: documents.length,
        durationMs: Date.now() - startedAt,
        model,
        operation: 'rerank',
        status: 'success',
      });

      return documents
        .map((document) => ({
          chunkId: document.chunkId,
          documentId: document.documentId,
          content: document.content,
          score: scoreByChunkId.get(document.chunkId) ?? document.score,
          metadata: document.metadata,
        }))
        .sort((left, right) => right.score - left.score);
    } catch (error) {
      this.observabilityService.recordReranker({
        documentCount: results.length,
        durationMs: Date.now() - startedAt,
        error,
        model,
        operation: 'rerank',
        status: 'failed',
      });
      throw error;
    }
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
