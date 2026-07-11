import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { AccessPolicyService } from '../access-policy';
import { DocumentRepository } from '../document';
import type { DocumentContentMetadata } from '../document';
import type { DocumentEntity } from '../document';
import {
  KnowledgeSpaceRepository,
  type KnowledgeSpaceEntity,
  type SpaceMemberRole,
} from '../knowledge-space';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { UpdateDocumentTaxonomyDto } from './dto/update-document-taxonomy.dto';
import type { UpdateTagDto } from './dto/update-tag.dto';
import type {
  DocumentCategoryEntity,
  DocumentTagEntity,
  DocumentTaxonomyEntity,
} from './entities/taxonomy.entity';
import { TaxonomyRepository } from './taxonomy.repository';
import type { TaxonomyOptions } from './taxonomy.types';

const readRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR', 'VIEWER'];
const writeRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR'];

@Injectable()
export class TaxonomyService {
  constructor(
    private readonly accessPolicyService: AccessPolicyService,
    private readonly documentRepository: DocumentRepository,
    private readonly knowledgeSpaceRepository: KnowledgeSpaceRepository,
    private readonly taxonomyRepository: TaxonomyRepository,
  ) {}

  async createCategory(
    context: ExecutionContext,
    spaceId: string,
    input: CreateCategoryDto,
  ): Promise<DocumentCategoryEntity> {
    await this.ensureSpaceRole(context, spaceId, writeRoles);
    await this.ensureParentCategory(spaceId, input.parentId);

    return this.taxonomyRepository.createCategory(spaceId, input);
  }

  async createTag(
    context: ExecutionContext,
    spaceId: string,
    input: CreateTagDto,
  ): Promise<DocumentTagEntity> {
    await this.ensureSpaceRole(context, spaceId, writeRoles);

    return this.taxonomyRepository.createTag(spaceId, input);
  }

  async deleteCategory(context: ExecutionContext, id: string): Promise<DocumentCategoryEntity> {
    const category = await this.findCategory(id);
    await this.ensureSpaceRole(context, category.spaceId, writeRoles);

    return this.taxonomyRepository.deleteCategory(id);
  }

  async deleteTag(context: ExecutionContext, id: string): Promise<DocumentTagEntity> {
    const tag = await this.findTag(id);
    await this.ensureSpaceRole(context, tag.spaceId, writeRoles);

    return this.taxonomyRepository.deleteTag(id);
  }

  async getDocumentTaxonomy(
    context: ExecutionContext,
    documentId: string,
  ): Promise<DocumentTaxonomyEntity> {
    await this.ensureDocumentReadAccess(context, documentId);

    return this.taxonomyRepository.getDocumentTaxonomy(documentId);
  }

  async listCategories(
    context: ExecutionContext,
    spaceId: string,
  ): Promise<DocumentCategoryEntity[]> {
    await this.ensureSpaceRole(context, spaceId, readRoles);

    return this.taxonomyRepository.listCategories(spaceId);
  }

  async listTags(context: ExecutionContext, spaceId: string): Promise<DocumentTagEntity[]> {
    await this.ensureSpaceRole(context, spaceId, readRoles);

    return this.taxonomyRepository.listTags(spaceId);
  }

  async listOptions(context: ExecutionContext, spaceId: string): Promise<TaxonomyOptions> {
    await this.ensureSpaceRole(context, spaceId, readRoles);

    const [categories, tags] = await Promise.all([
      this.taxonomyRepository.listCategories(spaceId),
      this.taxonomyRepository.listTags(spaceId),
    ]);

    return {
      categories,
      tags,
    };
  }

  async updateCategory(
    context: ExecutionContext,
    id: string,
    input: UpdateCategoryDto,
  ): Promise<DocumentCategoryEntity> {
    const category = await this.findCategory(id);
    await this.ensureSpaceRole(context, category.spaceId, writeRoles);
    await this.ensureParentCategory(category.spaceId, input.parentId, id);

    return this.taxonomyRepository.updateCategory(id, input);
  }

  async updateDocumentTaxonomy(
    context: ExecutionContext,
    documentId: string,
    input: UpdateDocumentTaxonomyDto,
  ): Promise<DocumentTaxonomyEntity> {
    const document = await this.ensureDocumentWriteAccess(context, documentId);
    const categoryId = await this.validateCategory(document.spaceId, input.categoryId);
    const tagIds = await this.validateTags(document.spaceId, input.tagIds ?? []);

    return this.taxonomyRepository.updateDocumentTaxonomy(documentId, {
      categoryId,
      tagIds,
    });
  }

  async updateTag(
    context: ExecutionContext,
    id: string,
    input: UpdateTagDto,
  ): Promise<DocumentTagEntity> {
    const tag = await this.findTag(id);
    await this.ensureSpaceRole(context, tag.spaceId, writeRoles);

    return this.taxonomyRepository.updateTag(id, input);
  }

  private async ensureDocumentReadAccess(
    context: ExecutionContext,
    id: string,
  ): Promise<DocumentEntity> {
    const document = await this.findDocument(id);
    const access = await this.ensureSpaceRole(context, document.spaceId, readRoles);
    const content = await this.documentRepository.findContentByDocumentId(document.id);

    this.accessPolicyService.assertCanReadKnowledgeResource(
      this.accessPolicyService.toSubject(context),
      this.toPolicyResource(access.space, access.memberRole, document, content?.metadata),
    );

    return document;
  }

  private async ensureDocumentWriteAccess(
    context: ExecutionContext,
    id: string,
  ): Promise<DocumentEntity> {
    const document = await this.findDocument(id);
    await this.ensureSpaceRole(context, document.spaceId, writeRoles);

    return document;
  }

  private async ensureParentCategory(
    spaceId: string,
    parentId?: string,
    currentCategoryId?: string,
  ): Promise<void> {
    if (!parentId) {
      return;
    }

    if (parentId === currentCategoryId) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    const parent = await this.taxonomyRepository.findCategoryById(parentId);

    if (!parent || parent.spaceId !== spaceId) {
      throw new BadRequestException('Parent category must belong to the same space');
    }
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

  private async findCategory(id: string): Promise<DocumentCategoryEntity> {
    const category = await this.taxonomyRepository.findCategoryById(id);

    if (!category) {
      throw new NotFoundException('Document category not found');
    }

    return category;
  }

  private async findDocument(id: string): Promise<DocumentEntity> {
    const document = await this.documentRepository.findActiveById(id);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  private async findTag(id: string): Promise<DocumentTagEntity> {
    const tag = await this.taxonomyRepository.findTagById(id);

    if (!tag) {
      throw new NotFoundException('Document tag not found');
    }

    return tag;
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

  private async validateCategory(
    spaceId: string,
    categoryId: string | null | undefined,
  ): Promise<string | null> {
    if (!categoryId) {
      return null;
    }

    const category = await this.taxonomyRepository.findCategoryById(categoryId);

    if (!category || category.spaceId !== spaceId) {
      throw new BadRequestException('Category must belong to the same space');
    }

    return category.id;
  }

  private async validateTags(spaceId: string, tagIds: string[]): Promise<string[]> {
    const uniqueTagIds = [...new Set(tagIds.filter(Boolean))];

    if (uniqueTagIds.length === 0) {
      return [];
    }

    const tags = await this.taxonomyRepository.findTagsByIds(uniqueTagIds);
    const matchingTagIds = new Set(
      tags.filter((tag) => tag.spaceId === spaceId).map((tag) => tag.id),
    );

    if (matchingTagIds.size !== uniqueTagIds.length) {
      throw new BadRequestException('Tags must belong to the same space');
    }

    return uniqueTagIds;
  }
}
