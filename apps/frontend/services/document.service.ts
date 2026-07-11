import type {
  DocumentAccessScope,
  DocumentAccessScopeResponse,
  DocumentMetadataResponse,
  DocumentPreviewResponse,
  KnowledgeDocument,
} from '@/types/workbench';
import { createApiUrl, createJsonHeaders, getAuthToken, readApiError } from './api-client';

export type DocumentFileDisposition = 'inline' | 'attachment';

export interface DocumentFileBlob {
  blob: Blob;
  filename: string;
  url: string;
}

const readFilename = (response: Response, fallback: string): string => {
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition);

  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const plainMatch = /filename="([^"]+)"/i.exec(disposition);

  return plainMatch?.[1] ?? fallback;
};

export const documentService = {
  getFileUrl(documentId: string, disposition: DocumentFileDisposition): string {
    return createApiUrl(`/documents/${documentId}/file?disposition=${disposition}`);
  },

  async fetchFile(
    document: KnowledgeDocument,
    disposition: DocumentFileDisposition,
  ): Promise<DocumentFileBlob> {
    const token = getAuthToken();
    const response = await fetch(documentService.getFileUrl(document.id, disposition), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    const blob = await response.blob();

    return {
      blob,
      filename: readFilename(response, document.title),
      url: URL.createObjectURL(blob),
    };
  },

  async download(document: KnowledgeDocument): Promise<void> {
    const file = await documentService.fetchFile(document, 'attachment');
    const link = window.document.createElement('a');

    link.href = file.url;
    link.download = file.filename;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(file.url);
  },

  async preview(document: KnowledgeDocument): Promise<DocumentFileBlob> {
    return documentService.fetchFile(document, 'inline');
  },

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

  async getPreview(documentId: string, maxChars = 20_000): Promise<DocumentPreviewResponse> {
    const response = await fetch(
      createApiUrl(`/documents/${documentId}/preview?maxChars=${maxChars}`),
      {
        headers: createJsonHeaders(),
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentPreviewResponse;
  },

  async getAccessScope(documentId: string): Promise<DocumentAccessScopeResponse> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/access-scope`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentAccessScopeResponse;
  },

  async updateAccessScope(
    documentId: string,
    accessScope: DocumentAccessScope,
  ): Promise<DocumentAccessScopeResponse> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/access-scope`), {
      body: JSON.stringify(accessScope),
      headers: createJsonHeaders(),
      method: 'PATCH',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DocumentAccessScopeResponse;
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
