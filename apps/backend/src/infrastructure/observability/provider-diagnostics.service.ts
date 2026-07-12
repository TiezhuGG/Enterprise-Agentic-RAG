import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config';
import type { AppErrorCode } from '../../common';
import type {
  ProviderHealthName,
  ProviderReadinessStage,
  ReadinessCheck,
} from './observability.types';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

interface EmbeddingResponse {
  data?: Array<{
    embedding?: unknown;
  }>;
}

interface RerankItem {
  document_index?: unknown;
  index?: unknown;
  relevance_score?: unknown;
  score?: unknown;
}

interface RerankResponse {
  data?: RerankItem[];
  results?: RerankItem[];
}

interface ProviderDiagnosticFailure {
  message: string;
  stage: ProviderReadinessStage;
  reachable: boolean;
}

const providerTimeoutMs = 5000;

class ProviderDiagnosticHttpError extends Error {
  constructor(readonly status: number) {
    super(`Provider request failed with status ${status}`);
  }
}

@Injectable()
export class ProviderDiagnosticsService {
  constructor(private readonly configService: ConfigService) {}

  async checkLlm(): Promise<ReadinessCheck> {
    const startedAt = Date.now();
    const config = this.configService.getLlmConfig();

    if (!config.apiUrl || !config.model || config.maxTokens <= 0) {
      return this.createFailedCheck('llm', startedAt, 'configuration', '大模型配置不完整', false);
    }

    try {
      const payload = await this.postJson<ChatCompletionResponse>(config.apiUrl, config.apiKey, {
        max_tokens: Math.min(config.maxTokens, 16),
        messages: [
          {
            role: 'user',
            content: 'ping',
          },
        ],
        model: config.model,
        stream: false,
        temperature: 0,
      });
      const content = payload.choices?.[0]?.message?.content;

      if (typeof content !== 'string') {
        return this.createFailedCheck('llm', startedAt, 'inference', '大模型返回格式异常', true);
      }

      return this.createOkCheck('llm', startedAt, '大模型服务可用');
    } catch (error) {
      const failure = this.toDiagnosticFailure(error, '大模型服务不可用');

      return this.createFailedCheck(
        'llm',
        startedAt,
        failure.stage,
        failure.message,
        failure.reachable,
      );
    }
  }

  async checkEmbedding(): Promise<ReadinessCheck> {
    const startedAt = Date.now();
    const config = this.configService.getEmbeddingConfig();

    if (!config.apiUrl || !config.model || config.dimension <= 0) {
      return this.createFailedCheck(
        'embedding',
        startedAt,
        'configuration',
        '向量模型配置不完整',
        false,
      );
    }

    try {
      const payload = await this.postJson<EmbeddingResponse>(config.apiUrl, config.apiKey, {
        input: 'ping',
        model: config.model,
      });
      const vector = payload.data?.[0]?.embedding;

      if (!Array.isArray(vector)) {
        return this.createFailedCheck(
          'embedding',
          startedAt,
          'inference',
          '向量模型返回格式异常',
          true,
        );
      }

      if (vector.length !== config.dimension) {
        return this.createFailedCheck(
          'embedding',
          startedAt,
          'inference',
          `向量模型维度不匹配，期望 ${config.dimension} 维，实际 ${vector.length} 维`,
          true,
        );
      }

      return this.createOkCheck('embedding', startedAt, '向量模型可用');
    } catch (error) {
      const failure = this.toDiagnosticFailure(error, '向量模型不可用');

      return this.createFailedCheck(
        'embedding',
        startedAt,
        failure.stage,
        failure.message,
        failure.reachable,
      );
    }
  }

  async checkReranker(): Promise<ReadinessCheck> {
    const startedAt = Date.now();
    const config = this.configService.getRerankerConfig();

    if (!config.apiUrl || !config.model) {
      return this.createFailedCheck(
        'reranker',
        startedAt,
        'configuration',
        '重排序服务配置不完整',
        false,
      );
    }

    try {
      const payload = await this.postJson<RerankResponse>(config.apiUrl, config.apiKey, {
        documents: ['企业报销需要审批', '天气晴朗'],
        model: config.model,
        query: '报销审批',
      });
      const scores = payload.results ?? payload.data;
      const firstScore = scores?.[0];
      const index = Number(firstScore?.index ?? firstScore?.document_index);
      const score = Number(firstScore?.relevance_score ?? firstScore?.score);

      if (!Array.isArray(scores) || !Number.isInteger(index) || !Number.isFinite(score)) {
        return this.createFailedCheck(
          'reranker',
          startedAt,
          'inference',
          '重排序返回格式异常',
          true,
        );
      }

      return this.createOkCheck('reranker', startedAt, '重排序服务可用');
    } catch (error) {
      const failure = this.toDiagnosticFailure(error, '重排序服务不可用');

      return this.createFailedCheck(
        'reranker',
        startedAt,
        failure.stage,
        failure.message,
        failure.reachable,
      );
    }
  }

  private async postJson<TPayload>(
    apiUrl: string,
    apiKey: string,
    body: Record<string, unknown>,
  ): Promise<TPayload> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), providerTimeoutMs);

    try {
      const response = await fetch(apiUrl, {
        body: JSON.stringify(body),
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        method: 'POST',
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new ProviderDiagnosticHttpError(response.status);
      }

      return (await response.json()) as TPayload;
    } finally {
      clearTimeout(timeout);
    }
  }

  private createOkCheck(
    name: ProviderHealthName,
    startedAt: number,
    message: string,
  ): ReadinessCheck {
    return {
      configured: true,
      durationMs: Date.now() - startedAt,
      inference: true,
      message,
      name,
      reachable: true,
      stage: 'inference',
      status: 'ok',
    };
  }

  private createFailedCheck(
    name: ProviderHealthName,
    startedAt: number,
    stage: ProviderReadinessStage,
    message: string,
    reachable: boolean,
  ): ReadinessCheck {
    return {
      code: this.toErrorCode(name),
      configured: stage !== 'configuration',
      durationMs: Date.now() - startedAt,
      inference: false,
      message,
      name,
      reachable,
      stage,
      status: 'failed',
    };
  }

  private toErrorCode(name: ProviderHealthName): AppErrorCode | undefined {
    switch (name) {
      case 'embedding':
        return 'EMBEDDING_UNAVAILABLE';
      case 'graph':
        return 'GRAPH_UNAVAILABLE';
      case 'llm':
        return 'LLM_UNAVAILABLE';
      case 'reranker':
        return 'RERANKER_UNAVAILABLE';
      default:
        return undefined;
    }
  }

  private toDiagnosticFailure(error: unknown, fallback: string): ProviderDiagnosticFailure {
    if (this.isHttpFailure(error)) {
      return {
        message: `${fallback}，HTTP ${error.status}`,
        reachable: true,
        stage: 'connectivity',
      };
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        message: `${fallback}，请求超时`,
        reachable: false,
        stage: 'connectivity',
      };
    }

    switch (this.getNetworkErrorCode(error)) {
      case 'ECONNRESET':
        return {
          message: `${fallback}，网关主动断开连接，请检查服务状态、HTTPS 配置或网络代理`,
          reachable: false,
          stage: 'connectivity',
        };
      case 'ECONNREFUSED':
        return {
          message: `${fallback}，无法连接网关服务`,
          reachable: false,
          stage: 'connectivity',
        };
      case 'ENOTFOUND':
        return {
          message: `${fallback}，无法解析网关域名`,
          reachable: false,
          stage: 'connectivity',
        };
      default:
        break;
    }

    return {
      message: fallback,
      reachable: false,
      stage: 'connectivity',
    };
  }

  private isHttpFailure(error: unknown): error is ProviderDiagnosticHttpError {
    return error instanceof ProviderDiagnosticHttpError;
  }

  private getNetworkErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const candidate = error as { cause?: unknown; code?: unknown };

    if (typeof candidate.code === 'string') {
      return candidate.code;
    }

    if (!candidate.cause || typeof candidate.cause !== 'object') {
      return null;
    }

    const cause = candidate.cause as { code?: unknown };

    return typeof cause.code === 'string' ? cause.code : null;
  }
}
