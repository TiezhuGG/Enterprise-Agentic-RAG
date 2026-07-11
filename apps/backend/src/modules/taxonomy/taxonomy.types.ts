import type { DocumentCategoryEntity, DocumentTagEntity } from './entities/taxonomy.entity';

export interface CategoryMutationInput {
  color?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  name: string;
  parentId?: string;
}

export interface TagMutationInput {
  color?: string;
  metadata?: Record<string, unknown>;
  name: string;
}

export interface DocumentTaxonomyUpdateInput {
  categoryId?: string | null;
  tagIds?: string[];
}

export interface TaxonomyOptions {
  categories: DocumentCategoryEntity[];
  tags: DocumentTagEntity[];
}
