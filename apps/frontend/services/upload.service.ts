import type { UploadDocumentResponse, UploadDocumentVersionResponse } from '@/types/workbench';
import { createApiUrl, getAuthToken, readApiError } from './api-client';

export const uploadService = {
  async uploadDocument(
    spaceId: string,
    file: File,
    input: { title?: string; description?: string } = {},
  ): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (input.title) {
      formData.append('title', input.title);
    }

    if (input.description) {
      formData.append('description', input.description);
    }

    const token = getAuthToken();
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/documents/upload`), {
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as UploadDocumentResponse;
  },

  async uploadDocumentVersion(
    documentId: string,
    file: File,
    input: { title?: string; description?: string } = {},
  ): Promise<UploadDocumentVersionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (input.title) {
      formData.append('title', input.title);
    }

    if (input.description) {
      formData.append('description', input.description);
    }

    const token = getAuthToken();
    const response = await fetch(createApiUrl(`/documents/${documentId}/versions/upload`), {
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as UploadDocumentVersionResponse;
  },
};
