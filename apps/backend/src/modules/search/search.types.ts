import type { RetrievalPipelineBreakdown } from '../retrieval';
import type { DocumentStatus, DocumentType } from '../document';

export const searchModes = ['fulltext', 'semantic', 'hybrid'] as const;
export type SearchMode = (typeof searchModes)[number];

export const searchSorts = ['relevance', 'updatedAt'] as const;
export type SearchSort = (typeof searchSorts)[number];

export interface SearchRequest {
  categoryId?: string;
  documentType?: DocumentType;
  tagId?: string;
  limit?: number;
  offset?: number;
  query: string;
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
