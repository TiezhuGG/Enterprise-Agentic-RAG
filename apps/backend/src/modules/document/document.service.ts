import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { extname } from 'node:path';
import type { ExecutionContext } from '../../common';
import { StorageService } from '../../infrastructure/storage';
import { AccessPolicyService } from '../access-policy';
import {
  KnowledgeSpaceRepository,
  type KnowledgeSpaceEntity,
  type SpaceMemberRole,
} from '../knowledge-space';
import type { UpdateDocumentAccessScopeDto } from './dto/update-document-access-scope.dto';
import type { CreateDocumentDto } from './dto/create-document.dto';
import type { UpdateDocumentDto } from './dto/update-document.dto';
import type { DocumentContentMetadata } from './entities/document-content.entity';
import type { DocumentAccessScope, DocumentEntity } from './entities/document.entity';
import type { DocumentVersionEntity } from './entities/document-version.entity';
import { normalizeDocumentAccessScope } from './entities/document.entity';
import { DocumentRepository } from './document.repository';

const readRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR', 'VIEWER'];
const writeRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR'];
const defaultPreviewMaxChars = 20_000;
const hardPreviewMaxChars = 50_000;

export interface DocumentMetadataResponse {
  documentId: string;
  metadata: DocumentContentMetadata;
}

export interface DocumentAccessScopeResponse {
  accessScope: DocumentAccessScope;
  documentId: string;
}

export interface DocumentFileResponse {
  buffer: Buffer;
  contentType: string;
  document: DocumentEntity;
  filename: string;
  size: number;
}

export interface DocumentPreviewResponse {
  document: DocumentEntity;
  file: {
    available: boolean;
    contentType: string | null;
    filename: string;
    inlineUrl: string | null;
  };
  metadata?: DocumentContentMetadata;
  parsedContent: {
    available: boolean;
    content: string;
    contentLength: number;
    format: 'markdown';
    maxChars: number;
    truncated: boolean;
  };
}

@Injectable()
export class DocumentService {
  constructor(
    private readonly accessPolicyService: AccessPolicyService,
    private readonly documentRepository: DocumentRepository,
    private readonly knowledgeSpaceRepository: KnowledgeSpaceRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(
    context: ExecutionContext,
    spaceId: string,
    input: CreateDocumentDto,
  ): Promise<DocumentEntity> {
    await this.ensureSpaceRole(context, spaceId, writeRoles);

    return this.documentRepository.create({
      spaceId,
      title: input.title,
      description: input.description,
      type: input.type,
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      size: input.size,
      createdBy: context.userId,
    });
  }

  async listBySpace(context: ExecutionContext, spaceId: string): Promise<DocumentEntity[]> {
    const access = await this.ensureSpaceRole(context, spaceId, readRoles);
    const documents = await this.documentRepository.listBySpace(spaceId);
    const contentByDocumentId = await this.findContentByDocumentIdMap(
      documents.map((document) => document.id),
    );

    return documents.filter(
      (document) =>
        this.accessPolicyService.canReadKnowledgeResource(
          this.accessPolicyService.toSubject(context),
          {
            ...this.toPolicyResource(
              access.space,
              access.memberRole,
              document,
              contentByDocumentId.get(document.id)?.metadata,
            ),
            spaceId: document.spaceId,
          },
        ).allowed,
    );
  }

  async getById(context: ExecutionContext, id: string): Promise<DocumentEntity> {
    const document = await this.findActiveDocument(id);
    const access = await this.ensureSpaceRole(context, document.spaceId, readRoles);
    const content = await this.documentRepository.findContentByDocumentId(document.id);

    this.accessPolicyService.assertCanReadKnowledgeResource(
      this.accessPolicyService.toSubject(context),
      this.toPolicyResource(access.space, access.memberRole, document, content?.metadata),
    );

    return document;
  }

  async getMetadata(context: ExecutionContext, id: string): Promise<DocumentMetadataResponse> {
    const document = await this.findActiveDocument(id);
    const access = await this.ensureSpaceRole(context, document.spaceId, readRoles);

    const content = await this.documentRepository.findContentByDocumentId(document.id);

    if (!content) {
      throw new NotFoundException('Document metadata not found');
    }

    this.accessPolicyService.assertCanReadKnowledgeResource(
      this.accessPolicyService.toSubject(context),
      this.toPolicyResource(access.space, access.memberRole, document, content.metadata),
    );

    return {
      documentId: document.id,
      metadata: this.mergeMetadataWithAccessScope(document, content.metadata),
    };
  }

  async getAccessScope(
    context: ExecutionContext,
    id: string,
  ): Promise<DocumentAccessScopeResponse> {
    const document = await this.findActiveDocument(id);
    const access = await this.ensureSpaceRole(context, document.spaceId, readRoles);
    const content = await this.documentRepository.findContentByDocumentId(document.id);

    this.accessPolicyService.assertCanReadKnowledgeResource(
      this.accessPolicyService.toSubject(context),
      this.toPolicyResource(access.space, access.memberRole, document, content?.metadata),
    );

    return {
      accessScope: document.accessScope,
      documentId: document.id,
    };
  }

  async listVersions(context: ExecutionContext, id: string): Promise<DocumentVersionEntity[]> {
    await this.ensureDocumentReadAccess(context, id);

    return this.documentRepository.listVersions(id);
  }

  async getVersion(
    context: ExecutionContext,
    id: string,
    versionId: string,
  ): Promise<DocumentVersionEntity> {
    await this.ensureDocumentReadAccess(context, id);

    const version = await this.documentRepository.findVersion(id, versionId);

    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    return version;
  }

  async getFile(context: ExecutionContext, id: string): Promise<DocumentFileResponse> {
    const document = await this.getById(context, id);

    if (!document.storageKey) {
      throw new NotFoundException('Document file not found');
    }

    const storedObject = await this.storageService.getObject(document.storageKey);

    return {
      buffer: storedObject.buffer,
      contentType: storedObject.contentType ?? document.mimeType ?? 'application/octet-stream',
      document,
      filename: this.resolveFilename(document),
      size: storedObject.size,
    };
  }

  async getPreview(
    context: ExecutionContext,
    id: string,
    maxChars?: number,
  ): Promise<DocumentPreviewResponse> {
    const document = await this.findActiveDocument(id);
    const access = await this.ensureSpaceRole(context, document.spaceId, readRoles);
    const content = await this.documentRepository.findContentByDocumentId(document.id);

    this.accessPolicyService.assertCanReadKnowledgeResource(
      this.accessPolicyService.toSubject(context),
      this.toPolicyResource(access.space, access.memberRole, document, content?.metadata),
    );

    const normalizedMaxChars = this.normalizePreviewMaxChars(maxChars);
    const contentValue = content?.content ?? '';
    const parsedContent = content
      ? {
          available: true,
          content: contentValue.slice(0, normalizedMaxChars),
          contentLength: contentValue.length,
          format: 'markdown' as const,
          maxChars: normalizedMaxChars,
          truncated: contentValue.length > normalizedMaxChars,
        }
      : {
          available: false,
          content: '',
          contentLength: 0,
          format: 'markdown' as const,
          maxChars: normalizedMaxChars,
          truncated: false,
        };

    return {
      document,
      file: {
        available: Boolean(document.storageKey),
        contentType: document.mimeType,
        filename: this.resolveFilename(document),
        inlineUrl: document.storageKey ? `/documents/${document.id}/file?disposition=inline` : null,
      },
      metadata: content ? this.mergeMetadataWithAccessScope(document, content.metadata) : undefined,
      parsedContent,
    };
  }

  async update(
    context: ExecutionContext,
    id: string,
    input: UpdateDocumentDto,
  ): Promise<DocumentEntity> {
    const document = await this.findActiveDocument(id);
    await this.ensureSpaceRole(
      context,
      document.spaceId,
      input.status === 'ARCHIVED' ? ['OWNER'] : writeRoles,
    );

    return this.documentRepository.update(id, input);
  }

  async updateAccessScope(
    context: ExecutionContext,
    id: string,
    input: UpdateDocumentAccessScopeDto,
  ): Promise<DocumentAccessScopeResponse> {
    const document = await this.findActiveDocument(id);
    await this.ensureSpaceRole(context, document.spaceId, writeRoles);
    const updatedDocument = await this.documentRepository.updateAccessScope(
      id,
      normalizeDocumentAccessScope(input),
    );

    return {
      accessScope: updatedDocument.accessScope,
      documentId: updatedDocument.id,
    };
  }

  async delete(context: ExecutionContext, id: string): Promise<DocumentEntity> {
    const document = await this.findActiveDocument(id);
    await this.ensureSpaceRole(context, document.spaceId, ['OWNER']);

    return this.documentRepository.update(id, {
      status: 'ARCHIVED',
    });
  }

  private async findActiveDocument(id: string): Promise<DocumentEntity> {
    const document = await this.documentRepository.findActiveById(id);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  private async ensureDocumentReadAccess(
    context: ExecutionContext,
    id: string,
  ): Promise<DocumentEntity> {
    const document = await this.findActiveDocument(id);
    const access = await this.ensureSpaceRole(context, document.spaceId, readRoles);
    const content = await this.documentRepository.findContentByDocumentId(document.id);

    this.accessPolicyService.assertCanReadKnowledgeResource(
      this.accessPolicyService.toSubject(context),
      this.toPolicyResource(access.space, access.memberRole, document, content?.metadata),
    );

    return document;
  }

  private async ensureSpaceRole(
    context: ExecutionContext,
    spaceId: string,
    allowedRoles: SpaceMemberRole[],
  ): Promise<{ memberRole: SpaceMemberRole; space: KnowledgeSpaceEntity }> {
    const space = await this.knowledgeSpaceRepository.findAccessibleById(
      spaceId,
      context.userId,
      context.tenantId,
    );

    if (!space) {
      throw new NotFoundException('Knowledge space not found');
    }

    const member = space.members.find((spaceMember) => spaceMember.userId === context.userId);

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient knowledge space role');
    }

    return {
      memberRole: member.role,
      space,
    };
  }

  private async findContentByDocumentIdMap(
    documentIds: string[],
  ): Promise<Map<string, { metadata: DocumentContentMetadata }>> {
    const contents = await this.documentRepository.findContentsByDocumentIds(documentIds);

    return new Map(
      contents.map((content) => [
        content.documentId,
        {
          metadata: content.metadata,
        },
      ]),
    );
  }

  private toPolicyResource(
    space: KnowledgeSpaceEntity,
    memberRole: SpaceMemberRole,
    document: DocumentEntity,
    metadata: DocumentContentMetadata | undefined,
  ) {
    return {
      allowedDepartmentIds:
        document.accessScope.allowedDepartmentIds ?? metadata?.allowedDepartmentIds,
      departmentId: document.accessScope.departmentId ?? metadata?.departmentId,
      securityLevel: document.accessScope.securityLevel ?? metadata?.securityLevel,
      spaceId: metadata?.spaceId ?? document.spaceId ?? space.id,
      spaceRole: memberRole,
      tenantId: space.tenantId,
    };
  }

  private mergeMetadataWithAccessScope(
    document: DocumentEntity,
    metadata: DocumentContentMetadata,
  ): DocumentContentMetadata {
    return {
      ...metadata,
      allowedDepartmentIds: document.accessScope.allowedDepartmentIds,
      departmentId: document.accessScope.departmentId,
      securityLevel: document.accessScope.securityLevel,
    };
  }

  private normalizePreviewMaxChars(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return defaultPreviewMaxChars;
    }

    return Math.min(Math.max(Math.trunc(value), 1), hardPreviewMaxChars);
  }

  private resolveFilename(document: DocumentEntity): string {
    const storageExtension = document.storageKey ? extname(document.storageKey) : '';
    const titleExtension = extname(document.title);
    const filename = titleExtension ? document.title : `${document.title}${storageExtension}`;

    return (
      filename
        .replace(/[/\\]/g, '_')
        .replace(/[\r\n"]/g, '_')
        .trim() || `document-${document.id}`
    );
  }
}
