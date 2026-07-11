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
  health: HealthResponse;
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
