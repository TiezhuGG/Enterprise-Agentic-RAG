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
