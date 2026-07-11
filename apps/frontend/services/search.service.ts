import type { SearchMode, SearchRequest, SearchResponse } from '@/types/search';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

const appendParam = (params: URLSearchParams, key: string, value: unknown): void => {
  if (value === undefined || value === null || value === '') {
    return;
  }

  params.set(key, String(value));
};

export const searchService = {
  async search(mode: SearchMode, request: SearchRequest): Promise<SearchResponse> {
    const params = new URLSearchParams();

    appendParam(params, 'q', request.q);
    appendParam(params, 'spaceId', request.spaceId);
    appendParam(params, 'categoryId', request.categoryId);
    appendParam(params, 'documentType', request.documentType);
    appendParam(params, 'tagId', request.tagId);
    appendParam(params, 'limit', request.limit);
    appendParam(params, 'offset', request.offset);
    appendParam(params, 'sort', request.sort);

    const response = await fetch(createApiUrl(`/search/${mode}?${params.toString()}`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as SearchResponse;
  },
};
