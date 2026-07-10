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
import type { CreateDocumentDto } from './dto/create-document.dto';
import type { UpdateDocumentDto } from './dto/update-document.dto';
import type { DocumentContentMetadata } from './entities/document-content.entity';
import type { DocumentEntity } from './entities/document.entity';
import { DocumentRepository } from './document.repository';

const readRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR', 'VIEWER'];
const writeRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR'];

export interface DocumentMetadataResponse {
  documentId: string;
  metadata: DocumentContentMetadata;
}

export interface DocumentFileResponse {
  buffer: Buffer;
  contentType: string;
  document: DocumentEntity;
  filename: string;
  size: number;
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
      this.toPolicyResource(access.space, access.memberRole, content?.metadata),
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
      this.toPolicyResource(access.space, access.memberRole, content.metadata),
    );

    return {
      documentId: document.id,
      metadata: content.metadata,
    };
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
    metadata: DocumentContentMetadata | undefined,
  ) {
    return {
      allowedDepartmentIds: metadata?.allowedDepartmentIds,
      departmentId: metadata?.departmentId,
      securityLevel: metadata?.securityLevel,
      spaceId: metadata?.spaceId ?? space.id,
      spaceRole: memberRole,
      tenantId: space.tenantId,
    };
  }

  private resolveFilename(document: DocumentEntity): string {
    const storageExtension = document.storageKey ? extname(document.storageKey) : '';
    const titleExtension = extname(document.title);
    const filename = titleExtension ? document.title : `${document.title}${storageExtension}`;

    return filename
      .replace(/[/\\]/g, '_')
      .replace(/[\r\n"]/g, '_')
      .trim() || `document-${document.id}`;
  }
}
