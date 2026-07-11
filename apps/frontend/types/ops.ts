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

export interface OpsAction {
  command: string;
  description: string;
  id: string;
  label: string;
}

export interface OpsSummary {
  actions: OpsAction[];
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
