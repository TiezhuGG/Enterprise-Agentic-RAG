import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { KnowledgeSpaceRepository, type SpaceMemberRole } from '../knowledge-space';
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

@Injectable()
export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly knowledgeSpaceRepository: KnowledgeSpaceRepository,
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
    await this.ensureSpaceRole(context, spaceId, readRoles);

    return this.documentRepository.listBySpace(spaceId);
  }

  async getById(context: ExecutionContext, id: string): Promise<DocumentEntity> {
    const document = await this.findActiveDocument(id);
    await this.ensureSpaceRole(context, document.spaceId, readRoles);

    return document;
  }

  async getMetadata(context: ExecutionContext, id: string): Promise<DocumentMetadataResponse> {
    const document = await this.findActiveDocument(id);
    await this.ensureSpaceRole(context, document.spaceId, readRoles);

    const content = await this.documentRepository.findContentByDocumentId(document.id);

    if (!content) {
      throw new NotFoundException('Document metadata not found');
    }

    return {
      documentId: document.id,
      metadata: content.metadata,
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
  ): Promise<void> {
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
  }
}
