import type {
  DocumentCategory,
  DocumentTag,
  DocumentTaxonomy,
  UpdateDocumentTaxonomyRequest,
} from '@/types/workbench';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const taxonomyService = {
  async createCategory(
    spaceId: string,
    input: { color?: string; description?: string; name: string; parentId?: string },
  ): Promise<DocumentCategory> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/categories`), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentCategory;
  },

  async createTag(spaceId: string, input: { color?: string; name: string }): Promise<DocumentTag> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/tags`), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentTag;
  },

  async getDocumentTaxonomy(documentId: string): Promise<DocumentTaxonomy> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/taxonomy`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentTaxonomy;
  },

  async listCategories(spaceId: string): Promise<DocumentCategory[]> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/categories`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentCategory[];
  },

  async listTags(spaceId: string): Promise<DocumentTag[]> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/tags`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentTag[];
  },

  async updateDocumentTaxonomy(
    documentId: string,
    input: UpdateDocumentTaxonomyRequest,
  ): Promise<DocumentTaxonomy> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/taxonomy`), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'PATCH',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentTaxonomy;
  },
};
