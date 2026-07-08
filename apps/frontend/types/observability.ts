export type ReadinessStatus = 'ok' | 'degraded';
export type ReadinessCheckStatus = 'ok' | 'failed' | 'skipped';

export type ReadinessCheckName =
  'database' | 'redis' | 'storage' | 'graph' | 'vector' | 'llm' | 'embedding' | 'reranker';

export interface ReadinessCheck {
  durationMs?: number;
  message?: string;
  name: ReadinessCheckName;
  status: ReadinessCheckStatus;
}

export interface ReadinessResponse {
  checks: ReadinessCheck[];
  status: ReadinessStatus;
  timestamp: string;
}

export interface MetricsBreakdown {
  agent: boolean;
  documentProcessing: boolean;
  embedding: boolean;
  ingestion: boolean;
  llm: boolean;
  memory: boolean;
  providerHealth: boolean;
  reranker: boolean;
  retrieval: boolean;
  storage: boolean;
  vector: boolean;
}

export type ExecutionRunStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';
export type ExecutionTraceEventStatus = 'STARTED' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';

export interface ExecutionRun {
  completedAt: string | null;
  conversationId: string | null;
  createdAt: string;
  durationMs: number | null;
  executionId: string;
  id: string;
  metadata: Record<string, unknown>;
  requestId: string;
  source: string;
  startedAt: string;
  status: ExecutionRunStatus;
  updatedAt: string;
  userId: string;
}

export interface ExecutionTraceEvent {
  durationMs: number | null;
  errorMessage: string | null;
  executionId: string;
  id: string;
  metadata: Record<string, unknown>;
  node: string | null;
  requestId: string;
  sequence: number;
  stage: string;
  status: ExecutionTraceEventStatus;
  timestamp: string;
  type: string;
  userId: string;
}

export interface ExecutionRunDetail extends ExecutionRun {
  events: ExecutionTraceEvent[];
}
