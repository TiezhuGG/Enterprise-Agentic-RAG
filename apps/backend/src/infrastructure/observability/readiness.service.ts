import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config';
import { GraphService } from '../graph';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis';
import { SearchService } from '../search';
import { StorageService } from '../storage';
import { VectorService } from '../vector';
import { ObservabilityService } from './observability.service';
import type { ProviderHealthName, ReadinessCheck, ReadinessResponse } from './observability.types';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly configService: ConfigService,
    private readonly graphService: GraphService,
    private readonly observabilityService: ObservabilityService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly searchService: SearchService,
    private readonly storageService: StorageService,
    private readonly vectorService: VectorService,
  ) {}

  async getReadiness(): Promise<ReadinessResponse> {
    const checks = await Promise.all([
      this.runCheck('database', () => this.prismaService.healthCheck()),
      this.runCheck('redis', () => this.redisService.ping()),
      this.runCheck('storage', () => this.storageService.healthCheck()),
      this.runCheck('graph', () => this.graphService.healthCheck()),
      this.runCheck('vector', () => this.vectorService.healthCheck()),
      this.runCheck('search', () => this.searchService.healthCheck()),
      this.runConfigCheck('llm', () => {
        const config = this.configService.getLlmConfig();

        return Boolean(config.apiUrl && config.model && config.maxTokens > 0);
      }),
      this.runConfigCheck('embedding', () => {
        const config = this.configService.getEmbeddingConfig();

        return Boolean(config.apiUrl && config.model && config.dimension > 0);
      }),
      this.runConfigCheck('reranker', () => {
        const config = this.configService.getRerankerConfig();

        return Boolean(config.apiUrl && config.model);
      }),
    ]);

    return {
      checks,
      status: checks.every((check) => check.status === 'ok' || check.status === 'skipped')
        ? 'ok'
        : 'degraded',
      timestamp: new Date().toISOString(),
    };
  }

  private async runCheck(
    name: ProviderHealthName,
    check: () => Promise<void>,
  ): Promise<ReadinessCheck> {
    const startedAt = Date.now();

    try {
      await check();
      const durationMs = Date.now() - startedAt;

      this.observabilityService.recordProviderHealth({
        durationMs,
        name,
        status: 'ok',
      });

      return {
        durationMs,
        name,
        status: 'ok',
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const message = this.toSafeMessage(error);

      this.observabilityService.recordProviderHealth({
        durationMs,
        error,
        message,
        name,
        status: 'failed',
      });

      return {
        durationMs,
        message,
        name,
        status: 'failed',
      };
    }
  }

  private async runConfigCheck(
    name: ProviderHealthName,
    check: () => boolean,
  ): Promise<ReadinessCheck> {
    const startedAt = Date.now();
    const ok = check();
    const durationMs = Date.now() - startedAt;
    const status = ok ? 'ok' : 'failed';
    const message = ok ? 'configured' : 'missing required provider configuration';

    this.observabilityService.recordProviderHealth({
      durationMs,
      message,
      name,
      status,
    });

    return {
      durationMs,
      message,
      name,
      status,
    };
  }

  private toSafeMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message.slice(0, 240);
    }

    return 'provider check failed';
  }
}
