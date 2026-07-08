import { BadRequestException, Injectable } from '@nestjs/common';
import { ObservabilityService } from '../observability';
import { VectorClient } from './vector.client';
import type {
  ChunkEmbeddingRecord,
  CreateChunkEmbeddingInput,
  VectorSearchInput,
  VectorSearchResult,
} from './vector.types';

@Injectable()
export class VectorService {
  constructor(
    private readonly observabilityService: ObservabilityService,
    private readonly vectorClient: VectorClient,
  ) {}

  async healthCheck(): Promise<void> {
    const startedAt = Date.now();

    try {
      await this.vectorClient.healthCheck();
      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        operation: 'healthCheck',
        status: 'success',
      });
    } catch (error) {
      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'healthCheck',
        status: 'failed',
      });
      throw error;
    }
  }

  async deleteByDocumentId(documentId: string): Promise<number> {
    const startedAt = Date.now();

    try {
      const deletedCount = await this.vectorClient.deleteByDocumentId(documentId);

      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        operation: 'deleteByDocumentId',
        recordCount: deletedCount,
        status: 'success',
      });

      return deletedCount;
    } catch (error) {
      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'deleteByDocumentId',
        status: 'failed',
      });
      throw error;
    }
  }

  async saveChunkEmbeddings(input: CreateChunkEmbeddingInput[]): Promise<ChunkEmbeddingRecord[]> {
    this.validateEmbeddings(input);

    if (input.length === 0) {
      return [];
    }

    const startedAt = Date.now();

    try {
      await this.vectorClient.createMany(input);
      const embeddings = await this.vectorClient.listByChunkIds(
        input.map((embedding) => embedding.chunkId),
      );

      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        operation: 'saveChunkEmbeddings',
        recordCount: embeddings.length,
        status: 'success',
      });

      return embeddings;
    } catch (error) {
      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'saveChunkEmbeddings',
        recordCount: input.length,
        status: 'failed',
      });
      throw error;
    }
  }

  async listByDocumentId(documentId: string): Promise<ChunkEmbeddingRecord[]> {
    const startedAt = Date.now();

    try {
      const embeddings = await this.vectorClient.listByDocumentId(documentId);

      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        operation: 'listByDocumentId',
        recordCount: embeddings.length,
        status: 'success',
      });

      return embeddings;
    } catch (error) {
      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'listByDocumentId',
        status: 'failed',
      });
      throw error;
    }
  }

  async searchSimilar(input: VectorSearchInput): Promise<VectorSearchResult[]> {
    if (input.vector.some((value) => !Number.isFinite(value))) {
      throw new BadRequestException('Query vector must contain finite numbers');
    }
    const startedAt = Date.now();

    try {
      const results = await this.vectorClient.searchSimilar(input);

      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        operation: 'searchSimilar',
        recordCount: results.length,
        status: 'success',
      });

      return results;
    } catch (error) {
      this.observabilityService.recordVector({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'searchSimilar',
        status: 'failed',
      });
      throw error;
    }
  }

  private validateEmbeddings(input: CreateChunkEmbeddingInput[]): void {
    for (const embedding of input) {
      if (embedding.dimension !== embedding.vector.length) {
        throw new BadRequestException('Embedding vector length does not match dimension');
      }

      if (embedding.vector.some((value) => !Number.isFinite(value))) {
        throw new BadRequestException('Embedding vector must contain finite numbers');
      }
    }
  }
}
