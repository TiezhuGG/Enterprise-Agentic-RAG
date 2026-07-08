export interface DemoHealth {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface DemoMetricsSummary {
  agentWorkflows: boolean;
  documentProcessing: boolean;
  ingestionRequests: boolean;
  llmRequests: boolean;
  retrievalRequests: boolean;
}

export type DemoReadinessStatus = 'ready' | 'degraded';

export type DemoStepStatus = 'pending' | 'active' | 'done' | 'blocked';

export interface DemoReadiness {
  health: DemoHealth | null;
  metricsSummary: DemoMetricsSummary;
  status: DemoReadinessStatus;
}

export interface DemoChecklistStep {
  detail: string;
  id: string;
  label: string;
  status: DemoStepStatus;
}
