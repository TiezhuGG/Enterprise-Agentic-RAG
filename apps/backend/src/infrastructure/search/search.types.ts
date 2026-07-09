export interface SearchChunkDocument {
  allowedDepartmentIds?: string[];
  chunkId: string;
  content: string;
  departmentId?: string;
  documentId: string;
  documentType: string;
  language: string;
  metadata: Record<string, unknown>;
  sectionTitle: string;
  securityLevel: string;
  sequence: number;
  spaceId: string;
  tokenCount: number;
  updatedAt: string;
}

export interface SearchChunkQuery {
  limit: number;
  query: string;
  spaceIds: string[];
}

export interface SearchChunkResult {
  chunkId: string;
  content: string;
  documentId: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface SearchReindexResult {
  indexedCount: number;
  index: string;
  sourceCount: number;
}

export interface ElasticsearchHit<TSource> {
  _id: string;
  _score?: number;
  _source?: TSource;
}

export interface ElasticsearchSearchResponse<TSource> {
  hits?: {
    hits?: ElasticsearchHit<TSource>[];
  };
}

export interface ElasticsearchBulkResponse {
  errors?: boolean;
  items?: Array<Record<string, { error?: unknown; status?: number }>>;
}
