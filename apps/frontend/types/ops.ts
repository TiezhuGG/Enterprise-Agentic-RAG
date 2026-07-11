import type { DemoHealth } from './demo';
import type { ReadinessCheck, ReadinessStatus } from './observability';

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
  finishedAt: string | null;
  id: string;
  space: {
    id: string;
    name: string;
  };
  startedAt: string;
  status: string;
}

export interface OpsExecutionRun {
  completedAt: string | null;
  durationMs: number | null;
  executionId: string;
  id: string;
  source: string;
  startedAt: string;
  status: string;
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
  health: DemoHealth;
  performance: OpsPerformanceSummary;
  pipeline: {
    byStatus: OpsCountByStatus[];
    failedLast24h: number;
    recent: OpsPipelineJob[];
  };
  readiness: {
    checks: ReadinessCheck[];
    failedChecks: number;
    status: ReadinessStatus;
  };
}
