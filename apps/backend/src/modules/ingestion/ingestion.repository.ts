import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { DocumentEntity } from '../document';
import type { SpaceMemberRole } from '../knowledge-space';
import type { DocumentAccessRecord, IngestionStatusRecord } from './ingestion.types';

type DocumentModel = DocumentEntity;

type DocumentWithMembership = DocumentModel & {
  space: {
    members: Array<{
      role: SpaceMemberRole;
    }>;
  };
};

const activeDocumentWhere = {
  status: {
    not: 'ARCHIVED',
  },
} as const;

const activeSpaceWhere = {
  status: {
    not: 'DELETED',
  },
} as const;

const toDocumentEntity = (document: DocumentModel): DocumentEntity => ({
  id: document.id,
  spaceId: document.spaceId,
  title: document.title,
  description: document.description,
  type: document.type,
  status: document.status,
  storageKey: document.storageKey,
  mimeType: document.mimeType,
  size: document.size,
  createdBy: document.createdBy,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

@Injectable()
export class IngestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDocumentAccessById(
    documentId: string,
    userId: string,
  ): Promise<DocumentAccessRecord | null> {
    const document = (await this.prisma.document.findFirst({
      where: {
        ...activeDocumentWhere,
        id: documentId,
        space: activeSpaceWhere,
      },
      include: {
        space: {
          select: {
            members: {
              where: {
                userId,
              },
              select: {
                role: true,
              },
            },
          },
        },
      },
    })) as DocumentWithMembership | null;

    if (!document) {
      return null;
    }

    return {
      document: toDocumentEntity(document),
      memberRole: document.space.members[0]?.role ?? null,
    };
  }

  async findSpaceMemberRole(spaceId: string, userId: string): Promise<SpaceMemberRole | null> {
    const member = await this.prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId,
        space: activeSpaceWhere,
      },
      select: {
        role: true,
      },
    });

    return member?.role ?? null;
  }

  async listActiveDocumentsBySpace(
    spaceId: string,
    documentIds?: string[],
  ): Promise<DocumentEntity[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        ...activeDocumentWhere,
        id: documentIds
          ? {
              in: documentIds,
            }
          : undefined,
        spaceId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return documents.map(toDocumentEntity);
  }

  async getStatusByDocumentId(documentId: string): Promise<IngestionStatusRecord | null> {
    const document = await this.prisma.document.findFirst({
      where: {
        ...activeDocumentWhere,
        id: documentId,
        space: activeSpaceWhere,
      },
    });

    if (!document) {
      return null;
    }

    const [documentContent, chunkCount, embeddingCount] = await Promise.all([
      this.prisma.documentContent.findUnique({
        select: {
          id: true,
        },
        where: {
          documentId,
        },
      }),
      this.prisma.chunk.count({
        where: {
          documentId,
        },
      }),
      this.prisma.chunkEmbedding.count({
        where: {
          chunk: {
            documentId,
          },
        },
      }),
    ]);

    return {
      document: toDocumentEntity(document),
      hasContent: Boolean(documentContent),
      chunkCount,
      embeddingCount,
    };
  }
}
