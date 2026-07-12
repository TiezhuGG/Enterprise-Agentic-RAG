export type SpaceMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type KnowledgeSpaceType = 'GENERAL' | 'DEPARTMENT' | 'PROJECT' | 'CUSTOMER';
export type AppSection =
  'dashboard' | 'documents' | 'search' | 'assistant' | 'graph' | 'profile' | 'system';

export interface SpaceMember {
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
}

export interface SpaceMemberUser {
  departmentId: string | null;
  email: string;
  id: string;
  name: string | null;
  organizationId: string | null;
  tenantId: string | null;
}

export interface SpaceMemberDetail extends SpaceMember {
  user: SpaceMemberUser;
}

export interface KnowledgeSpaceMetadata extends Record<string, unknown> {
  customerCode?: string;
  customerName?: string;
  departmentId?: string;
  ownerDepartmentId?: string;
  projectCode?: string;
  projectName?: string;
}

export interface KnowledgeSpace {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PRIVATE' | 'INTERNAL' | 'PUBLIC';
  type: KnowledgeSpaceType;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  ownerId: string;
  tenantId: string | null;
  metadata: KnowledgeSpaceMetadata;
  createdAt: string;
  updatedAt: string;
  members: SpaceMember[];
  documentCount: number;
  memberCount: number;
}

export type KnowledgeBaseSummary = KnowledgeSpace;

export type DocumentType = 'PDF' | 'WORD' | 'TXT' | 'MARKDOWN' | 'IMAGE' | 'AUDIO' | 'VIDEO';
export type DocumentStatus = 'CREATED' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';
export type DocumentSecurityLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';

export interface DocumentAccessScope {
  allowedDepartmentIds?: string[];
  departmentId?: string;
  securityLevel: DocumentSecurityLevel;
}

export interface DocumentCategory {
  id: string;
  spaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTag {
  id: string;
  spaceId: string;
  name: string;
  color: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTaxonomy {
  category: DocumentCategory | null;
  documentId: string;
  tags: DocumentTag[];
}

export interface UpdateDocumentTaxonomyRequest {
  categoryId?: string | null;
  tagIds?: string[];
}

export interface KnowledgeDocument {
  id: string;
  spaceId: string;
  title: string;
  description: string | null;
  type: DocumentType;
  status: DocumentStatus;
  accessScope: DocumentAccessScope;
  categoryId: string | null;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  description: string | null;
  type: DocumentType;
  status: DocumentStatus;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  sourceHash: string | null;
  contentHash: string | null;
  isCurrent: boolean;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentVersionResponse {
  document: KnowledgeDocument;
  ingestionJob: IngestionJobResponse | null;
  version: DocumentVersion;
}

export interface UploadDocumentResponse {
  document: KnowledgeDocument;
  ingestionJob: IngestionJobResponse | null;
}

export interface DocumentContentCleanerMetadata {
  inputLength: number;
  outputLength: number;
  removedCharacterCount: number;
  addedTitleHeading: boolean;
}

export interface DocumentContentOcrMetadata extends Record<string, unknown> {
  enabled: boolean;
  mode: 'native-text' | 'ocr';
  pageCount?: number;
  processedPages?: number;
  failedPages?: number;
  provider?: string;
  model?: string;
  renderWidth?: number;
  configuredRenderWidth?: number;
  maxImageDimension?: number;
}

export interface DocumentContentMetadata extends Record<string, unknown> {
  allowedDepartmentIds?: string[];
  departmentId?: string;
  documentId: string;
  spaceId: string;
  documentType: DocumentType;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  language: 'zh' | 'en' | 'mixed' | 'unknown';
  securityLevel: DocumentSecurityLevel;
  sourceHash: string;
  contentHash: string;
  contentLength: number;
  lineCount: number;
  parser: string;
  cleaner: DocumentContentCleanerMetadata;
  ocr?: DocumentContentOcrMetadata;
  processedAt: string;
}

export interface DocumentMetadataResponse {
  documentId: string;
  metadata: DocumentContentMetadata;
}

export interface DocumentPreviewResponse {
  document: KnowledgeDocument;
  file: {
    available: boolean;
    contentType: string | null;
    filename: string;
    inlineUrl: string | null;
  };
  metadata?: DocumentContentMetadata;
  parsedContent: {
    available: boolean;
    content: string;
    contentLength: number;
    format: 'markdown';
    maxChars: number;
    truncated: boolean;
  };
}

export interface DocumentAccessScopeResponse {
  accessScope: DocumentAccessScope;
  documentId: string;
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

export interface IngestionJobResponse {
  documentId: string;
  pipelineJobId: string;
  spaceId: string;
  status: 'QUEUED';
}

export type BatchOperation = 'archive' | 'ingest' | 'taxonomy';
export type BatchItemStatus = 'success' | 'failed';

export interface BatchOperationItem<TData = unknown> {
  data?: TData;
  documentId: string;
  errorMessage?: string;
  status: BatchItemStatus;
}

export interface BatchOperationResponse<TData = unknown> {
  failed: number;
  operation: BatchOperation;
  results: Array<BatchOperationItem<TData>>;
  succeeded: number;
  total: number;
}

export interface BatchState {
  errorMessage?: string;
  lastResult?: BatchOperationResponse;
  operation?: BatchOperation;
  status: 'idle' | 'running' | 'success' | 'error';
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

export type PipelineJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
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

export interface PipelineJobDocumentSummary {
  id: string;
  status: DocumentStatus;
  title: string;
  type: DocumentType;
}

export interface SpacePipelineJob extends PipelineJob {
  document: PipelineJobDocumentSummary;
  latestEvent: PipelineEvent | null;
}

export interface SpacePipelineJobList {
  items: SpacePipelineJob[];
  nextCursor: string | null;
}
export interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  filename?: string;
}

export interface IngestionOptions {
  includeGraph: boolean;
}

export interface IngestionState {
  status: 'idle' | 'queued' | 'running' | 'success' | 'error';
  errorMessage?: string;
  result?: IngestionResult;
  pipelineJobId?: string;
}
