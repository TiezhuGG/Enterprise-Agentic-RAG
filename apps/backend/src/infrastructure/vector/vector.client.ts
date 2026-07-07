import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { ChunkEmbeddingRecord, CreateChunkEmbeddingInput } from './vector.types';

type ChunkEmbeddingModel = ChunkEmbeddingRecord;

const toChunkEmbeddingRecord = (embedding: ChunkEmbeddingModel): ChunkEmbeddingRecord => ({
  id: embedding.id,
  chunkId: embedding.chunkId,
  model: embedding.model,
  dimension: embedding.dimension,
  vector: embedding.vector,
  createdAt: embedding.createdAt,
  updatedAt: embedding.updatedAt,
});

@Injectable()
export class VectorClient {
  constructor(private readonly prisma: PrismaService) {}

  async deleteByDocumentId(documentId: string): Promise<number> {
    const result = await this.prisma.chunkEmbedding.deleteMany({
      where: {
        chunk: {
          documentId,
        },
      },
    });

    return result.count;
  }

  async createMany(input: CreateChunkEmbeddingInput[]): Promise<void> {
    if (input.length === 0) {
      return;
    }

    await this.prisma.chunkEmbedding.createMany({
      data: input.map((embedding) => ({
        chunkId: embedding.chunkId,
        model: embedding.model,
        dimension: embedding.dimension,
        vector: embedding.vector,
      })),
    });
  }

  async listByDocumentId(documentId: string): Promise<ChunkEmbeddingRecord[]> {
    const embeddings = await this.prisma.chunkEmbedding.findMany({
      where: {
        chunk: {
          documentId,
        },
      },
      orderBy: {
        chunk: {
          sequence: 'asc',
        },
      },
    });

    return embeddings.map(toChunkEmbeddingRecord);
  }

  async listByChunkIds(chunkIds: string[]): Promise<ChunkEmbeddingRecord[]> {
    if (chunkIds.length === 0) {
      return [];
    }

    const embeddings = await this.prisma.chunkEmbedding.findMany({
      where: {
        chunkId: {
          in: chunkIds,
        },
      },
      orderBy: {
        chunk: {
          sequence: 'asc',
        },
      },
    });

    return embeddings.map(toChunkEmbeddingRecord);
  }
}
