export const executionRunStatuses = ['RUNNING', 'SUCCEEDED', 'FAILED'] as const;
export type ExecutionRunStatus = (typeof executionRunStatuses)[number];

export const executionTraceEventStatuses = ['STARTED', 'SUCCEEDED', 'FAILED', 'SKIPPED'] as const;
export type ExecutionTraceEventStatus = (typeof executionTraceEventStatuses)[number];

export const executionTraceEventTypes = [
  'workflow',
  'memory',
  'planner',
  'retrieval',
  'graph',
  'answer',
  'verification',
  'iteration',
  'error',
] as const;
export type ExecutionTraceEventType = (typeof executionTraceEventTypes)[number];

export interface ExecutionRunEntity {
  id: string;
  executionId: string;
  requestId: string;
  userId: string;
  conversationId: string | null;
  source: string;
  status: ExecutionRunStatus;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionTraceEventEntity {
  id: string;
  executionId: string;
  requestId: string;
  userId: string;
  type: ExecutionTraceEventType | string;
  stage: string;
  node: string | null;
  status: ExecutionTraceEventStatus;
  durationMs: number | null;
  sequence: number;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
  timestamp: Date;
}

export interface ExecutionRunDetail extends ExecutionRunEntity {
  events: ExecutionTraceEventEntity[];
}

export interface StartExecutionRunInput {
  executionId: string;
  requestId: string;
  userId: string;
  conversationId?: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface FinishExecutionRunInput {
  durationMs?: number;
  errorMessage?: string;
  executionId: string;
  metadata?: Record<string, unknown>;
  status: Extract<ExecutionRunStatus, 'SUCCEEDED' | 'FAILED'>;
}

export interface RecordExecutionTraceEventInput {
  durationMs?: number;
  errorMessage?: string;
  executionId: string;
  metadata?: Record<string, unknown>;
  node?: string;
  requestId: string;
  stage: string;
  status: ExecutionTraceEventStatus;
  type: ExecutionTraceEventType;
  userId: string;
}

export interface ListExecutionsOptions {
  limit?: number;
}
