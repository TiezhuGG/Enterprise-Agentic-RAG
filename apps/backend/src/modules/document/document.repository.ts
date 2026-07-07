import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { DocumentContentEntity } from './entities/document-content.entity';
import type { DocumentEntity, DocumentStatus, DocumentType } from './entities/document.entity';

export interface CreateDocumentInput {
  spaceId: string;
  title: string;
  description?: string;
  type: DocumentType;
  storageKey?: string;
  mimeType?: string;
  size?: number;
  createdBy: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  storageKey?: string;
  mimeType?: string;
  size?: number;
}

type DocumentModel = DocumentEntity;
type DocumentContentModel = DocumentContentEntity;

const activeDocumentWhere = {
  status: {
    not: 'ARCHIVED',
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

const toDocumentContentEntity = (content: DocumentContentModel): DocumentContentEntity => ({
  id: content.id,
  documentId: content.documentId,
  content: content.content,
  createdAt: content.createdAt,
  updatedAt: content.updatedAt,
});

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDocumentInput): Promise<DocumentEntity> {
    const document = await this.prisma.document.create({
      data: {
        spaceId: input.spaceId,
        title: input.title,
        description: input.description,
        type: input.type,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        size: input.size,
        createdBy: input.createdBy,
      },
    });

    return toDocumentEntity(document);
  }

  async listBySpace(spaceId: string): Promise<DocumentEntity[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        ...activeDocumentWhere,
        spaceId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return documents.map(toDocumentEntity);
  }

  async findActiveById(id: string): Promise<DocumentEntity | null> {
    const document = await this.prisma.document.findFirst({
      where: {
        ...activeDocumentWhere,
        id,
      },
    });

    return document ? toDocumentEntity(document) : null;
  }

  async update(id: string, input: UpdateDocumentInput): Promise<DocumentEntity> {
    const document = await this.prisma.document.update({
      where: {
        id,
      },
      data: input,
    });

    return toDocumentEntity(document);
  }

  async upsertContent(documentId: string, content: string): Promise<DocumentContentEntity> {
    const documentContent = await this.prisma.documentContent.upsert({
      where: {
        documentId,
      },
      update: {
        content,
      },
      create: {
        documentId,
        content,
      },
    });

    return toDocumentContentEntity(documentContent);
  }

  async findContentByDocumentId(documentId: string): Promise<DocumentContentEntity | null> {
    const content = await this.prisma.documentContent.findUnique({
      where: {
        documentId,
      },
    });

    return content ? toDocumentContentEntity(content) : null;
  }
}
