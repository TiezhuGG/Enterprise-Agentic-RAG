import type { KnowledgeSpace } from '@/types/workbench';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const knowledgeSpaceService = {
  async list(): Promise<KnowledgeSpace[]> {
    const response = await fetch(createApiUrl('/spaces'), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as KnowledgeSpace[];
  },

  async create(name: string): Promise<KnowledgeSpace> {
    const response = await fetch(createApiUrl('/spaces'), {
      body: JSON.stringify({
        name,
        visibility: 'PRIVATE',
      }),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as KnowledgeSpace;
  },

  async get(spaceId: string): Promise<KnowledgeSpace> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as KnowledgeSpace;
  },
};
