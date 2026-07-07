import { Injectable, ServiceUnavailableException } from '@nestjs/common';
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

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        query,
        documents: documents.map((document) => document.content),
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Reranker provider request failed');
    }

    const payload = (await response.json()) as OpenAiCompatibleRerankResponse;
    const rawScores = payload.data ?? payload.results;

    if (!Array.isArray(rawScores)) {
      throw new ServiceUnavailableException('Reranker provider returned invalid response');
    }

    return rawScores.map((rawScore) => {
      const index = this.resolveIndex(rawScore);
      const score = this.resolveScore(rawScore);
      const document = documents[index];

      if (!document) {
        throw new ServiceUnavailableException('Reranker provider returned invalid index');
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
      throw new ServiceUnavailableException('Reranker provider returned invalid index');
    }

    return index;
  }

  private resolveScore(rawScore: RawRerankItem): number {
    const score = Number(rawScore.relevance_score ?? rawScore.score);

    if (!Number.isFinite(score)) {
      throw new ServiceUnavailableException('Reranker provider returned invalid score');
    }

    return score;
  }
}
