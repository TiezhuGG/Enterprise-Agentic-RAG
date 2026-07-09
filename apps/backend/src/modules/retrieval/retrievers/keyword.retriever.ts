import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import { SearchService } from '../../../infrastructure/search';
import { ChunkRepository } from '../../chunk';
import type { RetrievalAccessContext, RetrieverResult } from '../retrieval.types';

@Injectable()
export class KeywordRetriever {
  constructor(
    private readonly chunkRepository: ChunkRepository,
    private readonly configService: ConfigService,
    private readonly searchService: SearchService,
  ) {}

  async retrieve(
    query: string,
    context: RetrievalAccessContext,
    limit: number,
  ): Promise<RetrieverResult[]> {
    if (!context.canRetrieve) {
      return [];
    }

    const results = await this.searchByKeyword(query, context, limit);

    return results.map((result) => ({
      chunkId: result.chunkId,
      documentId: result.documentId,
      content: result.content,
      score: result.score,
      metadata: result.metadata as RetrieverResult['metadata'],
      source: 'keyword',
    }));
  }

  private async searchByKeyword(query: string, context: RetrievalAccessContext, limit: number) {
    try {
      return await this.searchService.searchChunks({
        query,
        spaceIds: context.spaceIds,
        limit,
      });
    } catch (error) {
      if (!this.configService.getSearchConfig().enableFallback) {
        throw error;
      }

      return this.chunkRepository.searchByKeyword({
        query,
        spaceIds: context.spaceIds,
        limit,
      });
    }
  }
}
