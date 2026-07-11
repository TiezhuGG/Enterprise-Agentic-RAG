import { Injectable } from '@nestjs/common';
import { createAppServiceUnavailableException, postProviderJson } from '../../../common';
import { ConfigService } from '../../../config';
import type { RerankDocument, RerankScore } from '../reranker.types';
import type { RerankerProvider } from './reranker.provider';

interface RawRerankItem {
  index?: unknown;
  document_index?: unknown;
  relevance_score?: unknown;
  score?: unknown;
}

interface OpenAiCompatibleRerankResponse {
  data?: RawRerankItem[];
  results?: RawRerankItem[];
}

@Injectable()
export class BgeRerankerProvider implements RerankerProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(configService: ConfigService) {
    const rerankerConfig = configService.getRerankerConfig();

    this.apiUrl = rerankerConfig.apiUrl;
    this.apiKey = rerankerConfig.apiKey;
    this.model = rerankerConfig.model;
  }

  async rerank(query: string, documents: RerankDocument[]): Promise<RerankScore[]> {
    if (documents.length === 0) {
      return [];
    }

    const payload = await postProviderJson<OpenAiCompatibleRerankResponse>({
      apiKey: this.apiKey,
      apiUrl: this.apiUrl,
      body: {
        documents: documents.map((document) => document.content),
        model: this.model,
        query,
      },
      errorCode: 'RERANKER_UNAVAILABLE',
    });
    const rawScores = payload.data ?? payload.results;

    if (!Array.isArray(rawScores)) {
      throw createAppServiceUnavailableException('RERANKER_UNAVAILABLE', '重排序返回格式异常');
    }

    return rawScores.map((rawScore) => {
      const index = this.resolveIndex(rawScore);
      const score = this.resolveScore(rawScore);
      const document = documents[index];

      if (!document) {
        throw createAppServiceUnavailableException('RERANKER_UNAVAILABLE', '重排序返回索引异常');
      }

      return {
        chunkId: document.chunkId,
        score,
      };
    });
  }

  private resolveIndex(rawScore: RawRerankItem): number {
    const index = Number(rawScore.index ?? rawScore.document_index);

    if (!Number.isInteger(index) || index < 0) {
      throw createAppServiceUnavailableException('RERANKER_UNAVAILABLE', '重排序返回索引异常');
    }

    return index;
  }

  private resolveScore(rawScore: RawRerankItem): number {
    const score = Number(rawScore.relevance_score ?? rawScore.score);

    if (!Number.isFinite(score)) {
      throw createAppServiceUnavailableException('RERANKER_UNAVAILABLE', '重排序返回分数异常');
    }

    return score;
  }
}
