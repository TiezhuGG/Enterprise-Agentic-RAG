import type { ExecutionContext } from '../../common';

export type ObservabilityLogLevel = 'debug' | 'info' | 'warn' | 'error';
export type ObservabilityStatus = 'success' | 'failed' | 'skipped';

export interface ObservabilityLogInput {
  level: ObservabilityLogLevel;
  event: string;
  requestId?: string;
  executionId?: string;
  userId?: string;
  durationMs?: number;
  status?: ObservabilityStatus | number | string;
  metadata?: Record<string, unknown>;
  error?: unknown;
}

export interface MetricLabels {
  [key: string]: string | number | boolean | undefined;
}

export interface CounterSnapshot {
  name: string;
  labels: Record<string, string>;
  value: number;
}

export interface DurationSnapshot {
  name: string;
  labels: Record<string, string>;
  count: number;
  sum: number;
  max: number;
}

export interface HealthResponse {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

export interface HttpRequestObservation {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  error?: unknown;
}

export interface AgentWorkflowObservation {
  executionId: string;
  requestId?: string;
  userId?: string;
  durationMs: number;
  status: ObservabilityStatus;
  usedGraph?: boolean;
  usedRetrieval?: boolean;
  error?: unknown;
}

export interface AgentNodeObservation {
  executionId: string;
  requestId?: string;
  node: string;
  status: ObservabilityStatus;
  durationMs: number;
}

export interface RetrievalObservation {
  context: Pick<ExecutionContext, 'metadata' | 'userId'>;
  durationMs: number;
  resultCount: number;
  status: ObservabilityStatus;
  source: 'hybrid' | 'graph';
  error?: unknown;
}

export interface LlmObservation {
  context: Pick<ExecutionContext, 'metadata' | 'userId'>;
  durationMs: number;
  mode: 'chat' | 'stream';
  operation: string;
  status: ObservabilityStatus;
  tokenCount?: number;
  error?: unknown;
}

export interface UploadObservation {
  context: Pick<ExecutionContext, 'metadata' | 'userId'>;
  durationMs: number;
  mimeType?: string;
  size?: number;
  spaceId?: string;
  status: ObservabilityStatus;
  error?: unknown;
}

export interface DocumentProcessingObservation {
  documentId: string;
  durationMs: number;
  status: ObservabilityStatus;
  error?: unknown;
}
