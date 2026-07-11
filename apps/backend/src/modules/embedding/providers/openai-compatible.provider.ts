import { Injectable } from '@nestjs/common';
import { createAppServiceUnavailableException, postProviderJson } from '../../../common';
import { ConfigService } from '../../../config';
import type { EmbeddingProvider } from './embedding.provider';

interface OpenAiCompatibleEmbeddingResponse {
  data?: Array<{
    embedding?: unknown;
  }>;
}

@Injectable()
export class OpenAiCompatibleEmbeddingProvider implements EmbeddingProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly dimension: number;

  constructor(configService: ConfigService) {
    const embeddingConfig = configService.getEmbeddingConfig();

    this.apiUrl = embeddingConfig.apiUrl;
    this.apiKey = embeddingConfig.apiKey;
    this.model = embeddingConfig.model;
    this.dimension = embeddingConfig.dimension;
  }

  async embed(text: string): Promise<number[]> {
    const payload = await postProviderJson<OpenAiCompatibleEmbeddingResponse>({
      apiKey: this.apiKey,
      apiUrl: this.apiUrl,
      body: {
        input: text,
        model: this.model,
      },
      errorCode: 'EMBEDDING_UNAVAILABLE',
    });
    const vector = payload.data?.[0]?.embedding;

    if (!Array.isArray(vector)) {
      throw createAppServiceUnavailableException('EMBEDDING_UNAVAILABLE', '向量模型返回格式异常');
    }

    if (vector.length !== this.dimension) {
      throw createAppServiceUnavailableException(
        'EMBEDDING_UNAVAILABLE',
        `向量模型维度不匹配，期望 ${this.dimension} 维，实际 ${vector.length} 维`,
      );
    }

    return vector.map((value) => {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue)) {
        throw createAppServiceUnavailableException(
          'EMBEDDING_UNAVAILABLE',
          '向量模型返回了非数字向量',
        );
      }

      return numericValue;
    });
  }
}
