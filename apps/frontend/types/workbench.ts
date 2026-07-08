export type SpaceMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type WorkbenchTab = 'pipeline' | 'observability' | 'agent-debug' | 'assistant';

export interface SpaceMember {
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
}

export interface KnowledgeSpace {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PRIVATE' | 'INTERNAL' | 'PUBLIC';
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  ownerId: string;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  members: SpaceMember[];
}

export type DocumentType = 'PDF' | 'WORD' | 'TXT' | 'MARKDOWN' | 'IMAGE' | 'AUDIO' | 'VIDEO';
export type DocumentStatus = 'CREATED' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';

export interface KnowledgeDocument {
  id: string;
  spaceId: string;
  title: string;
  description: string | null;
  type: DocumentType;
  status: DocumentStatus;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentContentCleanerMetadata {
  inputLength: number;
  outputLength: number;
  removedCharacterCount: number;
  addedTitleHeading: boolean;
}

export interface DocumentContentMetadata extends Record<string, unknown> {
  documentId: string;
  spaceId: string;
  documentType: DocumentType;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  language: 'zh' | 'en' | 'mixed' | 'unknown';
  securityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  sourceHash: string;
  contentHash: string;
  contentLength: number;
  lineCount: number;
  parser: string;
  cleaner: DocumentContentCleanerMetadata;
  processedAt: string;
}

export interface DocumentMetadataResponse {
  documentId: string;
  metadata: DocumentContentMetadata;
}

export type IngestionStage =
  'validate' | 'document-processing' | 'chunking' | 'embedding' | 'graph-extraction' | 'done';

export type IngestionStageStatus = 'success' | 'failed' | 'skipped';

export interface IngestionStageResult {
  stage: IngestionStage;
  status: IngestionStageStatus;
  durationMs: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

export interface IngestionResult {
  documentId: string;
  spaceId: string;
  pipelineJobId?: string;
  status: 'READY' | 'FAILED';
  readyForRetrieval: boolean;
  stages: IngestionStageResult[];
  counts: {
    chunks: number;
    embeddings: number;
    graphEntities?: number;
    graphRelations?: number;
  };
}

export interface IngestionStatus {
  documentId: string;
  spaceId: string;
  documentStatus: DocumentStatus;
  hasContent: boolean;
  chunkCount: number;
  embeddingCount: number;
  graphEntityCount?: number;
  graphRelationCount?: number;
  readyForRetrieval: boolean;
}

export type PipelineJobStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
export type PipelineEventStatus = 'STARTED' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';

export interface PipelineJob {
  id: string;
  documentId: string;
  spaceId: string;
  executionId: string | null;
  requestId: string | null;
  triggeredBy: string | null;
  status: PipelineJobStatus;
  metadata: Record<string, unknown>;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineEvent {
  id: string;
  jobId: string;
  documentId: string;
  spaceId: string;
  stage: string;
  status: PipelineEventStatus;
  durationMs: number | null;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
}

export interface PipelineJobDetail extends PipelineJob {
  events: PipelineEvent[];
}

export interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  filename?: string;
}

export interface IngestionState {
  status: 'idle' | 'running' | 'success' | 'error';
  result?: IngestionResult;
}
