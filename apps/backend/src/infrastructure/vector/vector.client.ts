import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma';
import type {
  ChunkEmbeddingRecord,
  CreateChunkEmbeddingInput,
  VectorSearchInput,
  VectorSearchResult,
} from './vector.types';

interface ExtensionHealthRow {
  exists: boolean;
}

interface ChunkEmbeddingRow {
  id: string;
  chunkId: string;
  model: string;
  dimension: number;
  vector: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VectorSearchRow {
  chunkId: string;
  documentId: string;
  content: string;
  metadata: unknown;
  score: number;
}

const toChunkEmbeddingRecord = (embedding: ChunkEmbeddingRow): ChunkEmbeddingRecord => ({
  id: embedding.id,
  chunkId: embedding.chunkId,
  model: embedding.model,
  dimension: Number(embedding.dimension),
  vector: parseVectorText(embedding.vector),
  createdAt: embedding.createdAt,
  updatedAt: embedding.updatedAt,
});

const parseVectorText = (value: string): number[] => {
  const normalizedValue = value.trim().replace(/^\[/, '').replace(/\]$/, '');

  if (!normalizedValue) {
    return [];
  }

  return normalizedValue.split(',').map((item) => Number(item));
};

@Injectable()
export class VectorClient {
  constructor(private readonly prisma: PrismaService) {}

  async healthCheck(): Promise<void> {
    const rows = await this.prisma.queryRaw<ExtensionHealthRow[]>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'vector'
      ) AS "exists"
    `;

    if (!rows[0]?.exists) {
      throw new Error('pgvector extension is not enabled');
    }
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

    for (const embedding of input) {
      await this.prisma.executeRaw`
        INSERT INTO "chunk_embeddings" (
          "id",
          "chunk_id",
          "model",
          "dimension",
          "vector",
          "created_at",
          "updated_at"
        )
        VALUES (
          ${randomUUID()},
          ${embedding.chunkId},
          ${embedding.model},
          ${embedding.dimension},
          ${this.toVectorLiteral(embedding.vector)}::vector,
          NOW(),
          NOW()
        )
        ON CONFLICT ("chunk_id")
        DO UPDATE SET
          "model" = EXCLUDED."model",
          "dimension" = EXCLUDED."dimension",
          "vector" = EXCLUDED."vector",
          "updated_at" = NOW()
      `;
    }
  }

  async listByDocumentId(documentId: string): Promise<ChunkEmbeddingRecord[]> {
    const embeddings = await this.prisma.queryRaw<ChunkEmbeddingRow[]>`
      SELECT
        ce."id",
        ce."chunk_id" AS "chunkId",
        ce."model",
        ce."dimension",
        ce."vector"::text AS "vector",
        ce."created_at" AS "createdAt",
        ce."updated_at" AS "updatedAt"
      FROM "chunk_embeddings" ce
      INNER JOIN "chunks" c ON c."id" = ce."chunk_id"
      WHERE c."document_id" = ${documentId}
      ORDER BY c."sequence" ASC
    `;

    return embeddings.map(toChunkEmbeddingRecord);
  }

  async listByChunkIds(chunkIds: string[]): Promise<ChunkEmbeddingRecord[]> {
    if (chunkIds.length === 0) {
      return [];
    }

    const embeddings = await this.prisma.queryRaw<ChunkEmbeddingRow[]>`
      SELECT
        ce."id",
        ce."chunk_id" AS "chunkId",
        ce."model",
        ce."dimension",
        ce."vector"::text AS "vector",
        ce."created_at" AS "createdAt",
        ce."updated_at" AS "updatedAt"
      FROM "chunk_embeddings" ce
      INNER JOIN "chunks" c ON c."id" = ce."chunk_id"
      WHERE ce."chunk_id" = ANY(${chunkIds}::text[])
      ORDER BY c."sequence" ASC
    `;

    return embeddings.map(toChunkEmbeddingRecord);
  }

  async searchSimilar(input: VectorSearchInput): Promise<VectorSearchResult[]> {
    if (input.spaceIds.length === 0) {
      return [];
    }

    const vectorLiteral = this.toVectorLiteral(input.vector);
    const rows = await this.prisma.queryRaw<VectorSearchRow[]>`
      SELECT
        c."id" AS "chunkId",
        c."document_id" AS "documentId",
        c."content",
        c."metadata",
        (1 - (ce."vector" <=> ${vectorLiteral}::vector))::double precision AS "score"
      FROM "chunk_embeddings" ce
      INNER JOIN "chunks" c ON c."id" = ce."chunk_id"
      INNER JOIN "documents" d ON d."id" = c."document_id"
      WHERE ce."dimension" = ${input.vector.length}
        AND d."status" = 'READY'
        AND d."space_id" = ANY(${input.spaceIds}::text[])
      ORDER BY ce."vector" <=> ${vectorLiteral}::vector ASC, c."sequence" ASC
      LIMIT ${input.limit}
    `;

    return rows.map((row) => ({
      chunkId: row.chunkId,
      documentId: row.documentId,
      content: row.content,
      score: Number(row.score),
      metadata: this.toMetadata(row.metadata),
    }));
  }

  private toVectorLiteral(vector: number[]): string {
    return `[${vector.map((value) => String(value)).join(',')}]`;
  }

  private toMetadata(metadata: unknown): Record<string, unknown> {
    return typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};
  }
}
