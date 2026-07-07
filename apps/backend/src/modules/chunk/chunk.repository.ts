import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { DocumentContentEntity } from '../document';
import type { ChunkEntity, ChunkMetadata } from './chunk.entity';

export interface CreateChunkInput {
  documentId: string;
  content: string;
  sequence: number;
  tokenCount: number;
  metadata: ChunkMetadata;
}

type ChunkModel = Omit<ChunkEntity, 'metadata'> & {
  metadata: unknown;
};

type DocumentContentModel = DocumentContentEntity;

const toDocumentContentEntity = (content: DocumentContentModel): DocumentContentEntity => ({
  id: content.id,
  documentId: content.documentId,
  content: content.content,
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

  return {
    documentId: String(candidate?.documentId ?? ''),
    sequence: Number(candidate?.sequence ?? 0),
    sectionTitle: String(candidate?.sectionTitle ?? ''),
  };
};

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
        metadata: chunk.metadata,
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
}
