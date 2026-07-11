import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import {
  normalizeTaxonomyMetadata,
  type DocumentCategoryEntity,
  type DocumentTagEntity,
  type DocumentTaxonomyEntity,
} from './entities/taxonomy.entity';
import type {
  CategoryMutationInput,
  DocumentTaxonomyUpdateInput,
  TagMutationInput,
} from './taxonomy.types';

type CategoryModel = Omit<DocumentCategoryEntity, 'metadata'> & {
  metadata: unknown;
};
type TagModel = Omit<DocumentTagEntity, 'metadata'> & {
  metadata: unknown;
};
type DocumentTaxonomyModel = {
  category: CategoryModel | null;
  id: string;
  tagAssignments: Array<{
    tag: TagModel;
  }>;
};

const toCategoryEntity = (category: CategoryModel): DocumentCategoryEntity => ({
  id: category.id,
  spaceId: category.spaceId,
  name: category.name,
  description: category.description,
  color: category.color,
  parentId: category.parentId,
  metadata: normalizeTaxonomyMetadata(category.metadata),
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

const toTagEntity = (tag: TagModel): DocumentTagEntity => ({
  id: tag.id,
  spaceId: tag.spaceId,
  name: tag.name,
  color: tag.color,
  metadata: normalizeTaxonomyMetadata(tag.metadata),
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
});

const toPrismaMetadata = (
  metadata: Record<string, unknown> | undefined,
): Prisma.InputJsonObject | undefined =>
  metadata ? (metadata as Prisma.InputJsonObject) : undefined;

@Injectable()
export class TaxonomyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(
    spaceId: string,
    input: CategoryMutationInput,
  ): Promise<DocumentCategoryEntity> {
    const category = await this.prisma.documentCategory.create({
      data: {
        color: input.color,
        description: input.description,
        metadata: toPrismaMetadata(input.metadata),
        name: input.name,
        parentId: input.parentId,
        spaceId,
      },
    });

    return toCategoryEntity(category);
  }

  async createTag(spaceId: string, input: TagMutationInput): Promise<DocumentTagEntity> {
    const tag = await this.prisma.documentTag.create({
      data: {
        color: input.color,
        metadata: toPrismaMetadata(input.metadata),
        name: input.name,
        spaceId,
      },
    });

    return toTagEntity(tag);
  }

  async deleteCategory(id: string): Promise<DocumentCategoryEntity> {
    const category = await this.prisma.documentCategory.delete({
      where: {
        id,
      },
    });

    return toCategoryEntity(category);
  }

  async deleteTag(id: string): Promise<DocumentTagEntity> {
    const tag = await this.prisma.documentTag.delete({
      where: {
        id,
      },
    });

    return toTagEntity(tag);
  }

  async findCategoryById(id: string): Promise<DocumentCategoryEntity | null> {
    const category = await this.prisma.documentCategory.findUnique({
      where: {
        id,
      },
    });

    return category ? toCategoryEntity(category) : null;
  }

  async findTagById(id: string): Promise<DocumentTagEntity | null> {
    const tag = await this.prisma.documentTag.findUnique({
      where: {
        id,
      },
    });

    return tag ? toTagEntity(tag) : null;
  }

  async findTagsByIds(ids: string[]): Promise<DocumentTagEntity[]> {
    const tagIds = [...new Set(ids.filter(Boolean))];

    if (tagIds.length === 0) {
      return [];
    }

    const tags = await this.prisma.documentTag.findMany({
      where: {
        id: {
          in: tagIds,
        },
      },
    });

    return tags.map(toTagEntity);
  }

  async getDocumentTaxonomy(documentId: string): Promise<DocumentTaxonomyEntity> {
    const document = await this.prisma.document.findUnique({
      where: {
        id: documentId,
      },
      include: {
        category: true,
        tagAssignments: {
          include: {
            tag: true,
          },
          orderBy: {
            assignedAt: 'asc',
          },
        },
      },
    });

    return this.toDocumentTaxonomy(document);
  }

  async listCategories(spaceId: string): Promise<DocumentCategoryEntity[]> {
    const categories = await this.prisma.documentCategory.findMany({
      where: {
        spaceId,
      },
      orderBy: [
        {
          name: 'asc',
        },
      ],
    });

    return categories.map(toCategoryEntity);
  }

  async listTags(spaceId: string): Promise<DocumentTagEntity[]> {
    const tags = await this.prisma.documentTag.findMany({
      where: {
        spaceId,
      },
      orderBy: [
        {
          name: 'asc',
        },
      ],
    });

    return tags.map(toTagEntity);
  }

  async listTaxonomiesByDocumentIds(
    documentIds: string[],
  ): Promise<Map<string, DocumentTaxonomyEntity>> {
    const ids = [...new Set(documentIds.filter(Boolean))];

    if (ids.length === 0) {
      return new Map();
    }

    const documents = await this.prisma.document.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        category: true,
        tagAssignments: {
          include: {
            tag: true,
          },
          orderBy: {
            assignedAt: 'asc',
          },
        },
      },
    });

    return new Map(
      documents.map((document) => [
        document.id,
        {
          category: document.category ? toCategoryEntity(document.category) : null,
          documentId: document.id,
          tags: document.tagAssignments.map((assignment) => toTagEntity(assignment.tag)),
        },
      ]),
    );
  }

  async updateCategory(
    id: string,
    input: Partial<CategoryMutationInput>,
  ): Promise<DocumentCategoryEntity> {
    const category = await this.prisma.documentCategory.update({
      where: {
        id,
      },
      data: {
        color: input.color,
        description: input.description,
        metadata: toPrismaMetadata(input.metadata),
        name: input.name,
        parentId: input.parentId,
      },
    });

    return toCategoryEntity(category);
  }

  async updateDocumentTaxonomy(
    documentId: string,
    input: DocumentTaxonomyUpdateInput,
  ): Promise<DocumentTaxonomyEntity> {
    const tagIds = [...new Set(input.tagIds ?? [])];

    const taxonomy = await this.prisma.$transaction(async (transaction) => {
      await transaction.document.update({
        where: {
          id: documentId,
        },
        data: {
          categoryId: input.categoryId ?? null,
        },
      });

      await transaction.documentTagAssignment.deleteMany({
        where: {
          documentId,
        },
      });

      if (tagIds.length > 0) {
        await transaction.documentTagAssignment.createMany({
          data: tagIds.map((tagId) => ({
            documentId,
            tagId,
          })),
          skipDuplicates: true,
        });
      }

      return transaction.document.findUnique({
        where: {
          id: documentId,
        },
        include: {
          category: true,
          tagAssignments: {
            include: {
              tag: true,
            },
            orderBy: {
              assignedAt: 'asc',
            },
          },
        },
      });
    });

    return this.toDocumentTaxonomy(taxonomy);
  }

  async updateTag(id: string, input: Partial<TagMutationInput>): Promise<DocumentTagEntity> {
    const tag = await this.prisma.documentTag.update({
      where: {
        id,
      },
      data: {
        color: input.color,
        metadata: toPrismaMetadata(input.metadata),
        name: input.name,
      },
    });

    return toTagEntity(tag);
  }

  private toDocumentTaxonomy(document: DocumentTaxonomyModel | null): DocumentTaxonomyEntity {
    if (!document) {
      return {
        category: null,
        documentId: '',
        tags: [],
      };
    }

    return {
      category: document.category ? toCategoryEntity(document.category) : null,
      documentId: document.id,
      tags: document.tagAssignments.map((assignment) => toTagEntity(assignment.tag)),
    };
  }
}
