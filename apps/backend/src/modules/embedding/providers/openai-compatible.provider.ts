import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
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
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: this.model,
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Embedding provider request failed');
    }

    const payload = (await response.json()) as OpenAiCompatibleEmbeddingResponse;
    const vector = payload.data?.[0]?.embedding;

    if (!Array.isArray(vector)) {
      throw new ServiceUnavailableException('Embedding provider returned invalid response');
    }

    if (vector.length !== this.dimension) {
      throw new BadRequestException('Embedding provider returned unexpected vector dimension');
    }

    return vector.map((value) => {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue)) {
        throw new ServiceUnavailableException('Embedding provider returned non-numeric vector');
      }

      return numericValue;
    });
  }
}
