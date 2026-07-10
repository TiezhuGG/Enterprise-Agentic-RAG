import type { AgentCitation } from './agent';
import type { DocumentStatus, DocumentType } from './workbench';

export type SearchMode = 'fulltext' | 'semantic' | 'hybrid';
export type SearchSort = 'relevance' | 'updatedAt';

export interface SearchRequest {
  documentType?: DocumentType;
  limit?: number;
  offset?: number;
  q: string;
  sort?: SearchSort;
  spaceId?: string;
}

export interface SearchDocumentSource {
  id: string;
  spaceId: string;
  status: DocumentStatus;
  title: string;
  type: DocumentType;
  updatedAt: string;
}

export interface SearchResultItem {
  chunkId: string;
  content: string;
  document: SearchDocumentSource | null;
  documentId: string;
  metadata: Record<string, unknown>;
  score: number;
}

export type RetrievalPipelineStage =
  'vector' | 'keyword' | 'graph' | 'permission-filter' | 'rrf' | 'reranker' | 'context-builder';

export interface RetrievalStageBreakdown {
  durationMs: number;
  inputCount?: number;
  outputCount: number;
  reason?: string;
  stage: RetrievalPipelineStage;
  status: 'success' | 'failed' | 'skipped';
}

export interface RetrievalPipelineBreakdown {
  contextCount: number;
  filteredCount: number;
  graphCount: number;
  keywordCount: number;
  rerankedCount: number;
  rrfCount: number;
  scopedSpaceCount: number;
  stages: RetrievalStageBreakdown[];
  totalDurationMs: number;
  vectorCount: number;
}

export interface SearchResponse {
  breakdown: RetrievalPipelineBreakdown;
  limit: number;
  mode: SearchMode;
  offset: number;
  query: string;
  results: SearchResultItem[];
  sort: SearchSort;
  total: number;
}

export interface SearchHistoryItem {
  citations: AgentCitation[];
  createdAt: string;
  documentType?: DocumentType;
  id: string;
  mode: SearchMode;
  query: string;
  resultCount: number;
  sort: SearchSort;
  spaceId?: string;
}
