import type { DocumentEntity, DocumentStatus } from '../document';
import type { SpaceMemberRole } from '../knowledge-space';

export const ingestionStages = [
  'validate',
  'document-processing',
  'chunking',
  'embedding',
  'graph-extraction',
  'done',
] as const;

export type IngestionStage = (typeof ingestionStages)[number];
export type IngestionStageStatus = 'success' | 'failed' | 'skipped';

export interface IngestionStageResult {
  stage: IngestionStage;
  status: IngestionStageStatus;
  durationMs: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

export interface IngestionCounts {
  chunks: number;
  embeddings: number;
  graphEntities?: number;
  graphRelations?: number;
}

export interface IngestionResult {
  documentId: string;
  spaceId: string;
  status: Extract<DocumentStatus, 'READY' | 'FAILED'>;
  readyForRetrieval: boolean;
  stages: IngestionStageResult[];
  counts: IngestionCounts;
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

export interface SpaceIngestionFailure {
  documentId: string;
  errorMessage: string;
}

export interface SpaceIngestionResult {
  spaceId: string;
  total: number;
  succeeded: number;
  failed: number;
  results: IngestionResult[];
  failures: SpaceIngestionFailure[];
}

export interface DocumentAccessRecord {
  document: DocumentEntity;
  memberRole: SpaceMemberRole | null;
}

export interface IngestionStatusRecord {
  document: DocumentEntity;
  hasContent: boolean;
  chunkCount: number;
  embeddingCount: number;
}

export interface GraphCountRecord {
  graphEntities: number;
  graphRelations: number;
}
