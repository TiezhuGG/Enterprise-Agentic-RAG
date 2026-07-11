import type { KnowledgeSpace, SpaceMemberDetail, SpaceMemberRole } from '@/types/workbench';
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

  async listMembers(spaceId: string): Promise<SpaceMemberDetail[]> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/members`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as SpaceMemberDetail[];
  },

  async addMember(
    spaceId: string,
    input: { email: string; role: SpaceMemberRole },
  ): Promise<SpaceMemberDetail[]> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/members`), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as SpaceMemberDetail[];
  },

  async updateMember(
    spaceId: string,
    userId: string,
    input: { role: SpaceMemberRole },
  ): Promise<SpaceMemberDetail[]> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/members/${userId}`), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'PATCH',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as SpaceMemberDetail[];
  },

  async removeMember(spaceId: string, userId: string): Promise<SpaceMemberDetail[]> {
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/members/${userId}`), {
      headers: createJsonHeaders(),
      method: 'DELETE',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as SpaceMemberDetail[];
  },
};
