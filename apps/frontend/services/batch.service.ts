import type {
  BatchOperationResponse,
  DocumentTaxonomy,
  IngestionJobResponse,
  KnowledgeDocument,
  UpdateDocumentTaxonomyRequest,
} from '@/types/workbench';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const batchService = {
  async archiveDocuments(
    documentIds: string[],
  ): Promise<BatchOperationResponse<KnowledgeDocument>> {
    const response = await fetch(createApiUrl('/documents/batch/archive'), {
      body: JSON.stringify({ documentIds }),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as BatchOperationResponse<KnowledgeDocument>;
  },

  async ingestDocuments(
    documentIds: string[],
    input: { force?: boolean; includeEmbedding?: boolean; includeGraph?: boolean } = {},
  ): Promise<BatchOperationResponse<IngestionJobResponse>> {
    const response = await fetch(createApiUrl('/documents/batch/ingest'), {
      body: JSON.stringify({ ...input, documentIds }),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as BatchOperationResponse<IngestionJobResponse>;
  },

  async updateTaxonomy(
    documentIds: string[],
    input: UpdateDocumentTaxonomyRequest,
  ): Promise<BatchOperationResponse<DocumentTaxonomy>> {
    const response = await fetch(createApiUrl('/documents/batch/taxonomy'), {
      body: JSON.stringify({ ...input, documentIds }),
      headers: createJsonHeaders(),
      method: 'PATCH',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as BatchOperationResponse<DocumentTaxonomy>;
  },
};
