import { BadRequestException, Injectable } from '@nestjs/common';
import { VectorClient } from './vector.client';
import type { ChunkEmbeddingRecord, CreateChunkEmbeddingInput } from './vector.types';

@Injectable()
export class VectorService {
  constructor(private readonly vectorClient: VectorClient) {}

  async deleteByDocumentId(documentId: string): Promise<number> {
    return this.vectorClient.deleteByDocumentId(documentId);
  }

  async saveChunkEmbeddings(input: CreateChunkEmbeddingInput[]): Promise<ChunkEmbeddingRecord[]> {
    this.validateEmbeddings(input);

    if (input.length === 0) {
      return [];
    }

    await this.vectorClient.createMany(input);

    return this.vectorClient.listByChunkIds(input.map((embedding) => embedding.chunkId));
  }

  async listByDocumentId(documentId: string): Promise<ChunkEmbeddingRecord[]> {
    return this.vectorClient.listByDocumentId(documentId);
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
