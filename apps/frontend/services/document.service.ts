import type { DocumentMetadataResponse, KnowledgeDocument } from '@/types/workbench';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const documentService = {
  async listBySpace(spaceId: string): Promise<KnowledgeDocument[]> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/documents`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as KnowledgeDocument[];
  },

  async get(documentId: string): Promise<KnowledgeDocument> {
    const response = await fetch(createApiUrl(`/documents/${documentId}`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as KnowledgeDocument;
  },

  async getMetadata(documentId: string): Promise<DocumentMetadataResponse> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/metadata`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentMetadataResponse;
  },

  async delete(documentId: string): Promise<KnowledgeDocument> {
    const response = await fetch(createApiUrl(`/documents/${documentId}`), {
      headers: createJsonHeaders(),
      method: 'DELETE',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as KnowledgeDocument;
  },
};
