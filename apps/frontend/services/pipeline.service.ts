import type { PipelineEvent, PipelineJob, PipelineJobDetail } from '@/types/workbench';
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
