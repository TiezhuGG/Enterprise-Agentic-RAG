import type { ExecutionContext } from '../../common';
import type { ChunkMetadata } from '../chunk';

export type KnowledgeRequestContext = ExecutionContext;

export const retrievalPermissions = ['knowledge.retrieve', 'knowledge.read'] as const;
export const defaultRetrievalLimit = 10;
export const defaultRetrieverCandidateLimit = 20;
export const MAX_CONTEXT_TOKENS = 3000;
export const rrfRankConstant = 60;

export interface RetrievalRequest {
  query: string;
  limit?: number;
  vectorLimit?: number;
  keywordLimit?: number;
  maxContextTokens?: number;
  enableGraph?: boolean;
}

export interface RetrievalAccessContext {
  userId: string;
  roles: string[];
  permissions: string[];
  spaceIds: string[];
  canRetrieve: boolean;
}

export type RetrievalSource = 'vector' | 'keyword' | 'graph';

export interface RetrieverResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
  source: RetrievalSource;
}

export interface RetrievalResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
}

export interface ContextChunk {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
}
