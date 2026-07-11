export interface DocumentCategoryEntity {
  id: string;
  spaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentTagEntity {
  id: string;
  spaceId: string;
  name: string;
  color: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentTaxonomyEntity {
  category: DocumentCategoryEntity | null;
  documentId: string;
  tags: DocumentTagEntity[];
}

export const normalizeTaxonomyMetadata = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};
