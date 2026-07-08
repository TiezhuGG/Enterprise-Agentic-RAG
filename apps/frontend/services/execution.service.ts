import type { ExecutionRun, ExecutionRunDetail, ExecutionTraceEvent } from '@/types/observability';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const executionService = {
  async getExecution(executionId: string): Promise<ExecutionRunDetail> {
    const response = await fetch(createApiUrl(`/executions/${executionId}`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as ExecutionRunDetail;
  },

  async listExecutions(limit = 20): Promise<ExecutionRun[]> {
    const response = await fetch(createApiUrl(`/executions?limit=${limit}`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as ExecutionRun[];
  },

  async listTimeline(executionId: string): Promise<ExecutionTraceEvent[]> {
    const response = await fetch(createApiUrl(`/executions/${executionId}/timeline`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as ExecutionTraceEvent[];
  },
};
