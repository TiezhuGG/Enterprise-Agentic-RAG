import { Injectable } from '@nestjs/common';
import { getAppErrorResponse } from '../../common';
import { ConfigService } from '../../config';
import { GraphService } from '../graph';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis';
import { SearchService } from '../search';
import { StorageService } from '../storage';
import { VectorService } from '../vector';
import { ObservabilityService } from './observability.service';
import type { ProviderHealthName, ReadinessCheck, ReadinessResponse } from './observability.types';
import { ProviderDiagnosticsService } from './provider-diagnostics.service';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly configService: ConfigService,
    private readonly graphService: GraphService,
    private readonly observabilityService: ObservabilityService,
    private readonly providerDiagnosticsService: ProviderDiagnosticsService,
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
      this.runProviderDiagnostic(() => this.providerDiagnosticsService.checkLlm()),
      this.runProviderDiagnostic(() => this.providerDiagnosticsService.checkEmbedding()),
      this.runProviderDiagnostic(() => this.providerDiagnosticsService.checkReranker()),
      this.runConfigCheck('ocr', () => {
        const config = this.configService.getOcrConfig();

        return config.provider === 'metadata' || Boolean(config.apiUrl && config.model);
      }),
      this.runConfigCheck('asr', () => {
        const config = this.configService.getAsrConfig();

        return config.provider === 'metadata' || Boolean(config.apiUrl && config.model);
      }),
      this.runConfigCheck('video', () => {
        const config = this.configService.getVideoUnderstandingConfig();

        return config.provider === 'metadata' || Boolean(config.apiUrl && config.model);
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

  private async runProviderDiagnostic(
    check: () => Promise<ReadinessCheck>,
  ): Promise<ReadinessCheck> {
    const result = await check();

    this.observabilityService.recordProviderHealth({
      code: result.code,
      durationMs: result.durationMs ?? 0,
      message: result.message,
      name: result.name,
      status: result.status,
    });

    return result;
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
        configured: true,
        durationMs,
        inference: true,
        name,
        reachable: true,
        stage: 'connectivity',
        status: 'ok',
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const appError = getAppErrorResponse(error);
      const message = appError?.message ?? this.toSafeMessage(error);

      this.observabilityService.recordProviderHealth({
        code: appError?.code,
        durationMs,
        error,
        message,
        name,
        status: 'failed',
      });

      return {
        code: appError?.code,
        configured: true,
        durationMs,
        inference: false,
        message,
        name,
        reachable: false,
        stage: 'connectivity',
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
      configured: ok,
      durationMs,
      message,
      name,
      stage: 'configuration',
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
