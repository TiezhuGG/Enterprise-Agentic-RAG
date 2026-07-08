import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import type {
  ChunkEmbeddingRecord,
  CreateChunkEmbeddingInput,
  VectorSearchInput,
  VectorSearchResult,
} from './vector.types';

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

const cosineSimilarity = (left: number[], right: number[]): number => {
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

@Injectable()
export class VectorClient {
  constructor(private readonly prisma: PrismaService) {}

  async healthCheck(): Promise<void> {
    await this.prisma.chunkEmbedding.findFirst({
      select: {
        id: true,
      },
    });
  }

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

  async searchSimilar(input: VectorSearchInput): Promise<VectorSearchResult[]> {
    if (input.spaceIds.length === 0) {
      return [];
    }

    const embeddings = await this.prisma.chunkEmbedding.findMany({
      where: {
        dimension: input.vector.length,
        chunk: {
          document: {
            status: 'READY',
            spaceId: {
              in: input.spaceIds,
            },
          },
        },
      },
      include: {
        chunk: {
          select: {
            id: true,
            documentId: true,
            content: true,
            metadata: true,
          },
        },
      },
    });

    return embeddings
      .map((embedding) => ({
        chunkId: embedding.chunk.id,
        documentId: embedding.chunk.documentId,
        content: embedding.chunk.content,
        score: cosineSimilarity(input.vector, embedding.vector),
        metadata: embedding.chunk.metadata as Record<string, unknown>,
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, input.limit);
  }
}
