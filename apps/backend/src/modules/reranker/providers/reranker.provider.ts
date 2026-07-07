import type { RerankDocument, RerankScore } from '../reranker.types';

export const RERANKER_PROVIDER = Symbol('RERANKER_PROVIDER');

export interface RerankerProvider {
  rerank(query: string, documents: RerankDocument[]): Promise<RerankScore[]>;
}
