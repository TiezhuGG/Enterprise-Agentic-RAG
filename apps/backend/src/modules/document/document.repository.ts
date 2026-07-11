import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import {
  normalizeDocumentContentMetadata,
  type DocumentContentEntity,
  type DocumentContentMetadata,
} from './entities/document-content.entity';
import type {
  DocumentAccessScope,
  DocumentEntity,
  DocumentStatus,
  DocumentType,
} from './entities/document.entity';
import { normalizeDocumentAccessScope } from './entities/document.entity';
import {
  normalizeDocumentVersionMetadata,
  type DocumentVersionEntity,
} from './entities/document-version.entity';

export interface CreateDocumentInput {
  spaceId: string;
  title: string;
  description?: string;
  type: DocumentType;
  accessScope?: DocumentAccessScope;
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
  accessScope?: DocumentAccessScope;
  storageKey?: string;
  mimeType?: string;
  size?: number;
}

export interface CreateDocumentVersionInput {
  documentId: string;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  storageKey?: string;
  mimeType?: string;
  size?: number;
  sourceHash?: string;
  contentHash?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
}

type DocumentModel = Omit<DocumentEntity, 'accessScope'> & {
  accessScope: unknown;
};
type DocumentContentModel = Omit<DocumentContentEntity, 'metadata'> & {
  metadata: unknown;
};
type DocumentVersionModel = Omit<DocumentVersionEntity, 'metadata'> & {
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
  accessScope: normalizeDocumentAccessScope(document.accessScope),
  categoryId: document.categoryId,
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

const toDocumentVersionEntity = (version: DocumentVersionModel): DocumentVersionEntity => ({
  id: version.id,
  documentId: version.documentId,
  versionNumber: version.versionNumber,
  title: version.title,
  description: version.description,
  type: version.type,
  status: version.status,
  storageKey: version.storageKey,
  mimeType: version.mimeType,
  size: version.size,
  sourceHash: version.sourceHash,
  contentHash: version.contentHash,
  isCurrent: version.isCurrent,
  metadata: normalizeDocumentVersionMetadata(version.metadata),
  createdBy: version.createdBy,
  createdAt: version.createdAt,
  updatedAt: version.updatedAt,
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

const toPrismaDocumentAccessScope = (scope: DocumentAccessScope): Prisma.InputJsonObject => {
  const normalized = normalizeDocumentAccessScope(scope);
  const json: Record<string, Prisma.InputJsonValue> = {
    securityLevel: normalized.securityLevel,
  };

  if (normalized.departmentId) {
    json.departmentId = normalized.departmentId;
  }

  if (normalized.allowedDepartmentIds?.length) {
    json.allowedDepartmentIds = normalized.allowedDepartmentIds;
  }

  return json as Prisma.InputJsonObject;
};

const toPrismaDocumentVersionMetadata = (
  metadata: Record<string, unknown> | undefined,
): Prisma.InputJsonObject => {
  if (!metadata) {
    return {};
  }

  return metadata as Prisma.InputJsonObject;
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
        accessScope: input.accessScope ? toPrismaDocumentAccessScope(input.accessScope) : undefined,
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
    const document = await this.prisma.$transaction(async (transaction) => {
      const updatedDocument = await transaction.document.update({
        where: {
          id,
        },
        data: {
          ...input,
          accessScope: input.accessScope
            ? toPrismaDocumentAccessScope(input.accessScope)
            : undefined,
        },
      });

      if (input.status) {
        await transaction.documentVersion.updateMany({
          where: {
            documentId: id,
            isCurrent: true,
          },
          data: {
            status: input.status,
          },
        });
      }

      return updatedDocument;
    });

    return toDocumentEntity(document);
  }

  async updateAccessScope(id: string, accessScope: DocumentAccessScope): Promise<DocumentEntity> {
    const document = await this.prisma.document.update({
      where: {
        id,
      },
      data: {
        accessScope: toPrismaDocumentAccessScope(accessScope),
      },
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

    await this.prisma.documentVersion.updateMany({
      where: {
        documentId,
        isCurrent: true,
      },
      data: {
        contentHash: metadata.contentHash,
        sourceHash: metadata.sourceHash,
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

  async createNextVersion(input: CreateDocumentVersionInput): Promise<DocumentVersionEntity> {
    const version = await this.prisma.$transaction(async (transaction) => {
      const aggregate = await transaction.documentVersion.aggregate({
        where: {
          documentId: input.documentId,
        },
        _max: {
          versionNumber: true,
        },
      });
      const versionNumber = (aggregate._max.versionNumber ?? 0) + 1;

      await transaction.documentVersion.updateMany({
        where: {
          documentId: input.documentId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });

      return transaction.documentVersion.create({
        data: {
          contentHash: input.contentHash,
          createdBy: input.createdBy,
          description: input.description,
          documentId: input.documentId,
          isCurrent: true,
          metadata: toPrismaDocumentVersionMetadata(input.metadata),
          mimeType: input.mimeType,
          size: input.size,
          sourceHash: input.sourceHash,
          status: input.status,
          storageKey: input.storageKey,
          title: input.title,
          type: input.type,
          versionNumber,
        },
      });
    });

    return toDocumentVersionEntity(version);
  }

  async createNextVersionAndUpdateDocument(
    input: CreateDocumentVersionInput,
    documentInput: UpdateDocumentInput,
  ): Promise<{ document: DocumentEntity; version: DocumentVersionEntity }> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const aggregate = await transaction.documentVersion.aggregate({
        where: {
          documentId: input.documentId,
        },
        _max: {
          versionNumber: true,
        },
      });
      const versionNumber = (aggregate._max.versionNumber ?? 0) + 1;

      await transaction.documentVersion.updateMany({
        where: {
          documentId: input.documentId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });

      const version = await transaction.documentVersion.create({
        data: {
          contentHash: input.contentHash,
          createdBy: input.createdBy,
          description: input.description,
          documentId: input.documentId,
          isCurrent: true,
          metadata: toPrismaDocumentVersionMetadata(input.metadata),
          mimeType: input.mimeType,
          size: input.size,
          sourceHash: input.sourceHash,
          status: input.status,
          storageKey: input.storageKey,
          title: input.title,
          type: input.type,
          versionNumber,
        },
      });
      const document = await transaction.document.update({
        where: {
          id: input.documentId,
        },
        data: {
          ...documentInput,
          accessScope: documentInput.accessScope
            ? toPrismaDocumentAccessScope(documentInput.accessScope)
            : undefined,
        },
      });

      return {
        document,
        version,
      };
    });

    return {
      document: toDocumentEntity(result.document),
      version: toDocumentVersionEntity(result.version),
    };
  }

  async findVersion(documentId: string, versionId: string): Promise<DocumentVersionEntity | null> {
    const version = await this.prisma.documentVersion.findFirst({
      where: {
        documentId,
        id: versionId,
      },
    });

    return version ? toDocumentVersionEntity(version) : null;
  }

  async listVersions(documentId: string): Promise<DocumentVersionEntity[]> {
    const versions = await this.prisma.documentVersion.findMany({
      where: {
        documentId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    return versions.map(toDocumentVersionEntity);
  }
}
