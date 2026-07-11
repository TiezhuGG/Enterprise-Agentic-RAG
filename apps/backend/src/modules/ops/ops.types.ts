import type {
  HealthResponse,
  ReadinessCheck,
  ReadinessResponse,
} from '../../infrastructure/observability';

export interface OpsCountByStatus {
  count: number;
  status: string;
}

export interface OpsPipelineJob {
  document: {
    id: string;
    status: string;
    title: string;
    type: string;
  };
  errorMessage: string | null;
  finishedAt: Date | null;
  id: string;
  space: {
    id: string;
    name: string;
  };
  startedAt: Date;
  status: string;
}

export interface OpsExecutionRun {
  completedAt: Date | null;
  durationMs: number | null;
  executionId: string;
  id: string;
  source: string;
  startedAt: Date;
  status: string;
}

export interface OpsCostTraceEvent {
  metadata: Record<string, unknown>;
}

export interface OpsPerformanceRun {
  durationMs: number | null;
}

export interface OpsNodeLatencyEvent {
  durationMs: number | null;
  node: string | null;
  stage: string;
}

export interface OpsCostByModel {
  estimatedCost: number;
  model: string;
  totalTokens: number;
}

export interface OpsNodeLatency {
  averageDurationMs: number;
  count: number;
  maxDurationMs: number;
  node: string;
}

export interface OpsCostSummary {
  byModel: OpsCostByModel[];
  currency: string;
  outputTokens: number;
  promptTokens: number;
  totalEstimatedCost: number;
  totalTokens: number;
}

export interface OpsPerformanceSummary {
  averageDurationMs: number | null;
  nodeLatency: OpsNodeLatency[];
  p95DurationMs: number | null;
  slowExecutions: number;
}

export interface OpsAction {
  command: string;
  description: string;
  id: string;
  label: string;
}

export interface OpsSummary {
  actions: OpsAction[];
  cost: OpsCostSummary;
  documents: {
    byStatus: OpsCountByStatus[];
    total: number;
  };
  executions: {
    averageDurationMs: number | null;
    byStatus: OpsCountByStatus[];
    failedLast24h: number;
    recent: OpsExecutionRun[];
  };
  generatedAt: string;
  health: HealthResponse;
  performance: OpsPerformanceSummary;
  pipeline: {
    byStatus: OpsCountByStatus[];
    failedLast24h: number;
    recent: OpsPipelineJob[];
  };
  readiness: {
    checks: ReadinessCheck[];
    failedChecks: number;
    status: ReadinessResponse['status'];
  };
}

export interface OpsSummaryOptions {
  limit?: number;
}
