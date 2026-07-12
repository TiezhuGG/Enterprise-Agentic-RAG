import type { PipelineEvent, PipelineJob, PipelineJobDetail, PipelineJobStatus, SpacePipelineJobList } from '@/types/workbench';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const pipelineService = {
  async listDocumentJobs(documentId: string, limit = 10): Promise<PipelineJob[]> {
    const response = await fetch(
      createApiUrl(`/documents/${documentId}/pipeline/jobs?limit=${limit}`),
      {
        headers: createJsonHeaders(),
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as PipelineJob[];
  },

  async listSpaceJobs(
    spaceId: string,
    options: { cursor?: string; limit?: number; status?: PipelineJobStatus } = {},
  ): Promise<SpacePipelineJobList> {
    const searchParams = new URLSearchParams();
    if (options.cursor) searchParams.set('cursor', options.cursor);
    if (options.limit) searchParams.set('limit', String(options.limit));
    if (options.status) searchParams.set('status', options.status);
    const query = searchParams.toString();
    const response = await fetch(createApiUrl(`/spaces/${spaceId}/pipeline/jobs${query ? `?${query}` : ''}`), {
      headers: createJsonHeaders(), method: 'GET',
    });
    if (!response.ok) throw await readApiError(response);
    return (await response.json()) as SpacePipelineJobList;
  },
  async getJob(jobId: string): Promise<PipelineJobDetail> {
    const response = await fetch(createApiUrl(`/pipeline/jobs/${jobId}`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as PipelineJobDetail;
  },

  async listJobEvents(jobId: string): Promise<PipelineEvent[]> {
    const response = await fetch(createApiUrl(`/pipeline/jobs/${jobId}/events`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as PipelineEvent[];
  },
};
