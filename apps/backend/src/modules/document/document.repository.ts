import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import {
  normalizeDocumentContentMetadata,
  type DocumentContentEntity,
  type DocumentContentMetadata,
} from './entities/document-content.entity';
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
type DocumentContentModel = Omit<DocumentContentEntity, 'metadata'> & {
  metadata: unknown;
};

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
  metadata: normalizeDocumentContentMetadata(content.metadata, content.documentId),
  createdAt: content.createdAt,
  updatedAt: content.updatedAt,
});

const toPrismaDocumentContentMetadata = (
  metadata: DocumentContentMetadata,
): Prisma.InputJsonObject => {
  const json: Record<string, Prisma.InputJsonValue | null> = {
    cleaner: {
      addedTitleHeading: metadata.cleaner.addedTitleHeading,
      inputLength: metadata.cleaner.inputLength,
      outputLength: metadata.cleaner.outputLength,
      removedCharacterCount: metadata.cleaner.removedCharacterCount,
    },
    contentHash: metadata.contentHash,
    contentLength: metadata.contentLength,
    documentId: metadata.documentId,
    documentType: metadata.documentType,
    language: metadata.language,
    lineCount: metadata.lineCount,
    parser: metadata.parser,
    processedAt: metadata.processedAt,
    securityLevel: metadata.securityLevel,
    sourceHash: metadata.sourceHash,
    spaceId: metadata.spaceId,
  };

  if (metadata.mimeType) {
    json.mimeType = metadata.mimeType;
  }

  if (metadata.storageKey) {
    json.storageKey = metadata.storageKey;
  }

  if (metadata.departmentId) {
    json.departmentId = metadata.departmentId;
  }

  if (metadata.allowedDepartmentIds?.length) {
    json.allowedDepartmentIds = metadata.allowedDepartmentIds;
  }

  if (typeof metadata.size === 'number' && Number.isFinite(metadata.size)) {
    json.size = metadata.size;
  }

  if (metadata.ocr) {
    json.ocr = metadata.ocr as Prisma.InputJsonObject;
  }

  return json as Prisma.InputJsonObject;
};

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

  async findActiveByIds(ids: string[]): Promise<DocumentEntity[]> {
    const documentIds = [...new Set(ids.filter(Boolean))];

    if (documentIds.length === 0) {
      return [];
    }

    const documents = await this.prisma.document.findMany({
      where: {
        ...activeDocumentWhere,
        id: {
          in: documentIds,
        },
      },
    });

    return documents.map(toDocumentEntity);
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

  async upsertContent(
    documentId: string,
    content: string,
    metadata: DocumentContentMetadata,
  ): Promise<DocumentContentEntity> {
    const documentContent = await this.prisma.documentContent.upsert({
      where: {
        documentId,
      },
      update: {
        content,
        metadata: toPrismaDocumentContentMetadata(metadata),
      },
      create: {
        documentId,
        content,
        metadata: toPrismaDocumentContentMetadata(metadata),
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

  async findContentsByDocumentIds(documentIds: string[]): Promise<DocumentContentEntity[]> {
    if (documentIds.length === 0) {
      return [];
    }

    const contents = await this.prisma.documentContent.findMany({
      where: {
        documentId: {
          in: [...new Set(documentIds)],
        },
      },
    });

    return contents.map(toDocumentContentEntity);
  }
}
