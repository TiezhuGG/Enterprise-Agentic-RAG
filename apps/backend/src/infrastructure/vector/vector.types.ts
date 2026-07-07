export interface ChunkEmbeddingRecord {
  id: string;
  chunkId: string;
  model: string;
  dimension: number;
  vector: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChunkEmbeddingInput {
  chunkId: string;
  model: string;
  dimension: number;
  vector: number[];
}

export interface VectorSearchInput {
  vector: number[];
  spaceIds: string[];
  limit: number;
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}
