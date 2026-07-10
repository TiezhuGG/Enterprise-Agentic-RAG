import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import { normalizeDocumentContentMetadata, type DocumentContentEntity } from '../document';
import type { ChunkEntity, ChunkMetadata } from './chunk.entity';

export interface CreateChunkInput {
  documentId: string;
  content: string;
  sequence: number;
  tokenCount: number;
  metadata: ChunkMetadata;
}

export interface KeywordSearchInput {
  query: string;
  spaceIds: string[];
  limit: number;
}

export interface ChunkSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
}

interface KeywordSearchRow {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: unknown;
}

type ChunkModel = Omit<ChunkEntity, 'metadata'> & {
  metadata: unknown;
};

type DocumentContentModel = Omit<DocumentContentEntity, 'metadata'> & {
  metadata: unknown;
};

const toDocumentContentEntity = (content: DocumentContentModel): DocumentContentEntity => ({
  id: content.id,
  documentId: content.documentId,
  content: content.content,
  metadata: normalizeDocumentContentMetadata(content.metadata, content.documentId),
  createdAt: content.createdAt,
  updatedAt: content.updatedAt,
});

const toChunkEntity = (chunk: ChunkModel): ChunkEntity => ({
  id: chunk.id,
  documentId: chunk.documentId,
  content: chunk.content,
  sequence: chunk.sequence,
  tokenCount: chunk.tokenCount,
  metadata: toChunkMetadata(chunk.metadata),
  createdAt: chunk.createdAt,
  updatedAt: chunk.updatedAt,
});

const toChunkMetadata = (metadata: unknown): ChunkMetadata => {
  const candidate = metadata as Partial<ChunkMetadata> | null;
  const allowedDepartmentIds = Array.isArray(candidate?.allowedDepartmentIds)
    ? candidate.allowedDepartmentIds
        .filter((departmentId): departmentId is string => typeof departmentId === 'string')
        .map((departmentId) => departmentId.trim())
        .filter(Boolean)
    : [];
  const departmentId =
    typeof candidate?.departmentId === 'string' && candidate.departmentId.trim()
      ? candidate.departmentId.trim()
      : undefined;
  const chunkMetadata: ChunkMetadata = {
    contentHash: String(candidate?.contentHash ?? ''),
    documentId: String(candidate?.documentId ?? ''),
    documentType: String(candidate?.documentType ?? ''),
    language: String(candidate?.language ?? 'unknown'),
    securityLevel: String(candidate?.securityLevel ?? 'INTERNAL'),
    sectionTitle: String(candidate?.sectionTitle ?? ''),
    sequence: Number(candidate?.sequence ?? 0),
    sourceHash: String(candidate?.sourceHash ?? ''),
    spaceId: String(candidate?.spaceId ?? ''),
  };

  if (departmentId) {
    chunkMetadata.departmentId = departmentId;
  }

  if (allowedDepartmentIds.length > 0) {
    chunkMetadata.allowedDepartmentIds = allowedDepartmentIds;
  }

  return chunkMetadata;
};

const toPrismaMetadata = (metadata: ChunkMetadata): Prisma.InputJsonObject =>
  JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonObject;

@Injectable()
export class ChunkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDocumentContentByDocumentId(documentId: string): Promise<DocumentContentEntity | null> {
    const content = await this.prisma.documentContent.findUnique({
      where: {
        documentId,
      },
    });

    return content ? toDocumentContentEntity(content) : null;
  }

  async deleteByDocumentId(documentId: string): Promise<number> {
    const result = await this.prisma.chunk.deleteMany({
      where: {
        documentId,
      },
    });

    return result.count;
  }

  async createMany(input: CreateChunkInput[]): Promise<ChunkEntity[]> {
    if (input.length === 0) {
      return [];
    }

    const documentId = input[0].documentId;

    await this.prisma.chunk.createMany({
      data: input.map((chunk) => ({
        documentId: chunk.documentId,
        content: chunk.content,
        sequence: chunk.sequence,
        tokenCount: chunk.tokenCount,
        metadata: toPrismaMetadata(chunk.metadata),
      })),
    });

    return this.listByDocumentId(documentId);
  }

  async listByDocumentId(documentId: string): Promise<ChunkEntity[]> {
    const chunks = await this.prisma.chunk.findMany({
      where: {
        documentId,
      },
      orderBy: {
        sequence: 'asc',
      },
    });

    return chunks.map(toChunkEntity);
  }

  async listByDocumentIds(documentIds: string[]): Promise<ChunkEntity[]> {
    const uniqueDocumentIds = [...new Set(documentIds.filter(Boolean))];

    if (uniqueDocumentIds.length === 0) {
      return [];
    }

    const chunks = await this.prisma.chunk.findMany({
      orderBy: [
        {
          documentId: 'asc',
        },
        {
          sequence: 'asc',
        },
      ],
      where: {
        documentId: {
          in: uniqueDocumentIds,
        },
      },
    });

    return chunks.map(toChunkEntity);
  }

  async searchByKeyword(input: KeywordSearchInput): Promise<ChunkSearchResult[]> {
    if (input.spaceIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.queryRaw<KeywordSearchRow[]>`
      WITH search_query AS (
        SELECT websearch_to_tsquery('simple', ${input.query}) AS query
      )
      SELECT
        c.id AS "chunkId",
        c.document_id AS "documentId",
        c.content,
        c.metadata,
        ts_rank_cd(to_tsvector('simple', c.content), search_query.query)::double precision AS score
      FROM chunks c
      INNER JOIN documents d ON d.id = c.document_id
      CROSS JOIN search_query
      WHERE d.space_id = ANY(${input.spaceIds}::text[])
        AND d.status = 'READY'
        AND to_tsvector('simple', c.content) @@ search_query.query
      ORDER BY score DESC, c.sequence ASC
      LIMIT ${input.limit}
    `;

    return rows.map((row) => ({
      chunkId: row.chunkId,
      documentId: row.documentId,
      content: row.content,
      score: Number(row.score),
      metadata: toChunkMetadata(row.metadata),
    }));
  }
}
