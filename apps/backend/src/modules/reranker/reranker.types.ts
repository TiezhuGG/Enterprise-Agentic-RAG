import type { ChunkMetadata } from '../chunk';

export interface RerankDocument {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
}

export interface RerankScore {
  chunkId: string;
  score: number;
}

export interface RerankResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
}
