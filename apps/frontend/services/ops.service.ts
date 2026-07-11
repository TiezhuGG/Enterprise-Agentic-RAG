import type { OpsSummary } from '@/types/ops';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const opsService = {
  async getSummary(limit = 10): Promise<OpsSummary> {
    const response = await fetch(createApiUrl(`/ops/summary?limit=${limit}`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as OpsSummary;
  },
};
