import type { DemoHealth, DemoMetricsSummary, DemoReadiness } from '@/types/demo';
import { createApiUrl, readApiError } from './api-client';

const metricNames: Record<keyof DemoMetricsSummary, string> = {
  agentWorkflows: 'agent_workflows_total',
  documentProcessing: 'document_processing_total',
  ingestionRequests: 'ingestion_requests_total',
  llmRequests: 'llm_requests_total',
  retrievalRequests: 'retrieval_requests_total',
};

const parseMetricsSummary = (metricsText: string): DemoMetricsSummary =>
  Object.fromEntries(
    Object.entries(metricNames).map(([key, metricName]) => [key, metricsText.includes(metricName)]),
  ) as unknown as DemoMetricsSummary;

const emptyMetricsSummary = (): DemoMetricsSummary => ({
  agentWorkflows: false,
  documentProcessing: false,
  ingestionRequests: false,
  llmRequests: false,
  retrievalRequests: false,
});

export const systemService = {
  async getHealth(): Promise<DemoHealth> {
    const response = await fetch(createApiUrl('/health'), {
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as DemoHealth;
  },

  async getMetricsText(): Promise<string> {
    const response = await fetch(createApiUrl('/metrics'), {
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return response.text();
  },

  async getReadiness(): Promise<DemoReadiness> {
    const health = await this.getHealth();
    let metricsSummary = emptyMetricsSummary();
    let status: DemoReadiness['status'] = health.status === 'ok' ? 'ready' : 'degraded';

    try {
      metricsSummary = parseMetricsSummary(await this.getMetricsText());
    } catch {
      status = 'degraded';
    }

    return {
      health,
      metricsSummary,
      status,
    };
  },
};
