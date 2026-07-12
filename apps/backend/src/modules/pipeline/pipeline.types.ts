export const pipelineJobStatuses = ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED'] as const;
export type PipelineJobStatus = (typeof pipelineJobStatuses)[number];

export const pipelineEventStatuses = ['STARTED', 'SUCCEEDED', 'FAILED', 'SKIPPED'] as const;
export type PipelineEventStatus = (typeof pipelineEventStatuses)[number];

export type PipelineStageStatus = 'success' | 'failed' | 'skipped';

export interface PipelineJobEntity {
  id: string;
  documentId: string;
  spaceId: string;
  executionId: string | null;
  requestId: string | null;
  triggeredBy: string | null;
  status: PipelineJobStatus;
  metadata: Record<string, unknown>;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineEventEntity {
  id: string;
  jobId: string;
  documentId: string;
  spaceId: string;
  stage: string;
  status: PipelineEventStatus;
  durationMs: number | null;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: Date;
}

export interface PipelineJobDetail extends PipelineJobEntity {
  events: PipelineEventEntity[];
}

export interface PipelineJobDocumentSummary {
  id: string;
  status: string;
  title: string;
  type: string;
}

export interface SpacePipelineJobEntity extends PipelineJobEntity {
  document: PipelineJobDocumentSummary;
  latestEvent: PipelineEventEntity | null;
}

export interface SpacePipelineJobList {
  items: SpacePipelineJobEntity[];
  nextCursor: string | null;
}

export interface CreatePipelineJobInput {
  documentId: string;
  spaceId: string;
  executionId?: string;
  requestId?: string;
  triggeredBy?: string;
  status?: PipelineJobStatus;
  metadata?: Record<string, unknown>;
}

export interface CreatePipelineEventInput {
  jobId: string;
  documentId: string;
  spaceId: string;
  stage: string;
  status: PipelineEventStatus;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

export interface RecordPipelineStageInput {
  stage: string;
  status: PipelineStageStatus;
  durationMs: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}
