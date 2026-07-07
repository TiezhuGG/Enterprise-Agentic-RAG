import { Injectable } from '@nestjs/common';
import { ChunkRepository } from '../../chunk';
import type { RetrievalAccessContext, RetrieverResult } from '../retrieval.types';

@Injectable()
export class KeywordRetriever {
  constructor(private readonly chunkRepository: ChunkRepository) {}

  async retrieve(
    query: string,
    context: RetrievalAccessContext,
    limit: number,
  ): Promise<RetrieverResult[]> {
    if (!context.canRetrieve) {
      return [];
    }

    const results = await this.chunkRepository.searchByKeyword({
      query,
      spaceIds: context.spaceIds,
      limit,
    });

    return results.map((result) => ({
      chunkId: result.chunkId,
      documentId: result.documentId,
      content: result.content,
      score: result.score,
      metadata: result.metadata,
      source: 'keyword',
    }));
  }
}
