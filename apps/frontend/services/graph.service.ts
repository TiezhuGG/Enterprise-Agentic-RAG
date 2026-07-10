import type { GraphView } from '@/types/graph';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const graphService = {
  async getDocumentGraph(documentId: string): Promise<GraphView> {
    const response = await fetch(createApiUrl(`/documents/${documentId}/graph`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as GraphView;
  },

  async getSpaceGraph(
    spaceId: string,
    input: { limit?: number; query?: string } = {},
  ): Promise<GraphView> {
    const params = new URLSearchParams();

    if (input.query?.trim()) {
      params.set('query', input.query.trim());
    }

    if (input.limit) {
      params.set('limit', String(input.limit));
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/graph${suffix}`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as GraphView;
  },
};
