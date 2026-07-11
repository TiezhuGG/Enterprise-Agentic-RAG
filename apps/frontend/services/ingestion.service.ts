import type { IngestionJobResponse, IngestionResult, IngestionStatus } from '@/types/workbench';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const ingestionService = {
  async ingestDocument(
    documentId: string,
    input: { force?: boolean; includeEmbedding?: boolean; includeGraph?: boolean } = {},
  ): Promise<IngestionResult> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/ingest`), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as IngestionResult;
  },

  async enqueueDocumentIngestion(
    documentId: string,
    input: { force?: boolean; includeEmbedding?: boolean; includeGraph?: boolean } = {},
  ): Promise<IngestionJobResponse> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/ingest/jobs`), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as IngestionJobResponse;
  },

  async getStatus(documentId: string): Promise<IngestionStatus> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/ingest/status`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as IngestionStatus;
  },
};
