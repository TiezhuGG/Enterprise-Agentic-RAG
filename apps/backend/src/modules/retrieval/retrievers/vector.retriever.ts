import { Inject, Injectable } from '@nestjs/common';
import { VectorService } from '../../../infrastructure/vector';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from '../../embedding/providers/embedding.provider';
import type { RetrievalAccessContext, RetrieverResult } from '../retrieval.types';

@Injectable()
export class VectorRetriever {
  constructor(
    private readonly vectorService: VectorService,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async retrieve(
    query: string,
    context: RetrievalAccessContext,
    limit: number,
  ): Promise<RetrieverResult[]> {
    if (!context.canRetrieve) {
      return [];
    }

    const queryVector = await this.embeddingProvider.embed(query);
    const results = await this.vectorService.searchSimilar({
      vector: queryVector,
      spaceIds: context.spaceIds,
      limit,
    });

    return results.map((result) => ({
      chunkId: result.chunkId,
      documentId: result.documentId,
      content: result.content,
      score: result.score,
      metadata: {
        documentId: String(result.metadata.documentId ?? result.documentId),
        sequence: Number(result.metadata.sequence ?? 0),
        sectionTitle: String(result.metadata.sectionTitle ?? ''),
        spaceId: String(result.metadata.spaceId ?? ''),
        documentType: String(result.metadata.documentType ?? ''),
        language: String(result.metadata.language ?? 'unknown'),
        securityLevel: String(result.metadata.securityLevel ?? 'INTERNAL'),
        sourceHash: String(result.metadata.sourceHash ?? ''),
        contentHash: String(result.metadata.contentHash ?? ''),
      },
      source: 'vector',
    }));
  }
}
