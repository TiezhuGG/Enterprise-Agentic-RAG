import type { MetricsBreakdown, ReadinessResponse } from '@/types/observability';
import { createApiUrl, readApiError } from './api-client';

const metricNames: Record<keyof MetricsBreakdown, string> = {
  agent: 'agent_workflows_total',
  documentProcessing: 'document_processing_total',
  embedding: 'embedding_requests_total',
  ingestion: 'ingestion_requests_total',
  llm: 'llm_requests_total',
  memory: 'memory_operations_total',
  providerHealth: 'provider_health_total',
  reranker: 'reranker_requests_total',
  retrieval: 'retrieval_requests_total',
  search: 'search_operations_total',
  storage: 'storage_operations_total',
  vector: 'vector_operations_total',
};

export const parseMetricsBreakdown = (metricsText: string): MetricsBreakdown => ({
  agent: metricsText.includes(metricNames.agent),
  documentProcessing: metricsText.includes(metricNames.documentProcessing),
  embedding: metricsText.includes(metricNames.embedding),
  ingestion: metricsText.includes(metricNames.ingestion),
  llm: metricsText.includes(metricNames.llm),
  memory: metricsText.includes(metricNames.memory),
  providerHealth: metricsText.includes(metricNames.providerHealth),
  reranker: metricsText.includes(metricNames.reranker),
  retrieval: metricsText.includes(metricNames.retrieval),
  search: metricsText.includes(metricNames.search),
  storage: metricsText.includes(metricNames.storage),
  vector: metricsText.includes(metricNames.vector),
});

export const observabilityService = {
  async getMetricsText(): Promise<string> {
    const response = await fetch(createApiUrl('/metrics'), {
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return response.text();
  },

  async getReadiness(): Promise<ReadinessResponse> {
    const response = await fetch(createApiUrl('/health/readiness'), {
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as ReadinessResponse;
  },

  parseMetricsBreakdown,
};
