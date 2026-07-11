import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import { ObservabilityService } from '../../infrastructure/observability';
import { ReadinessService } from '../../infrastructure/observability/readiness.service';
import type {
  OpsAction,
  OpsCostByModel,
  OpsCostSummary,
  OpsCostTraceEvent,
  OpsNodeLatency,
  OpsNodeLatencyEvent,
  OpsPerformanceRun,
  OpsPerformanceSummary,
  OpsSummary,
  OpsSummaryOptions,
} from './ops.types';
import { OpsRepository } from './ops.repository';

const defaultLimit = 10;
const maxLimit = 50;
const metricsSampleLimit = 500;
const slowExecutionThresholdMs = 10_000;
const dayMs = 24 * 60 * 60 * 1000;

@Injectable()
export class OpsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
    private readonly opsRepository: OpsRepository,
    private readonly readinessService: ReadinessService,
  ) {}

  async getSummary(
    context: ExecutionContext,
    options: OpsSummaryOptions = {},
  ): Promise<OpsSummary> {
    const limit = this.normalizeLimit(options.limit);
    const since = new Date(Date.now() - dayMs);
    const [health, readiness, spaceIds] = await Promise.all([
      Promise.resolve(this.observabilityService.getHealth()),
      this.readinessService.getReadiness(),
      this.opsRepository.listAccessibleSpaceIds({
        tenantId: context.tenantId,
        userId: context.userId,
      }),
    ]);

    const [
      documentCounts,
      pipelineCounts,
      failedPipelineLast24h,
      recentPipelineJobs,
      executionCounts,
      failedExecutionsLast24h,
      averageExecutionDuration,
      recentExecutionRuns,
      costEvents,
      performanceRuns,
      nodeLatencyEvents,
    ] = await Promise.all([
      this.opsRepository.countDocumentsByStatus(spaceIds),
      this.opsRepository.countPipelineJobsByStatus(spaceIds),
      this.opsRepository.countPipelineFailuresSince(spaceIds, since),
      this.opsRepository.listRecentPipelineJobs(spaceIds, limit),
      this.opsRepository.countExecutionRunsByStatus(context.userId),
      this.opsRepository.countExecutionFailuresSince(context.userId, since),
      this.opsRepository.getAverageExecutionDuration(context.userId),
      this.opsRepository.listRecentExecutionRuns(context.userId, limit),
      this.opsRepository.listCostTraceEvents(context.userId, metricsSampleLimit),
      this.opsRepository.listPerformanceRuns(context.userId, metricsSampleLimit),
      this.opsRepository.listNodeLatencyEvents(context.userId, metricsSampleLimit),
    ]);

    return {
      actions: this.createActions(),
      cost: this.createCostSummary(costEvents),
      documents: {
        byStatus: documentCounts,
        total: this.sumCounts(documentCounts),
      },
      executions: {
        averageDurationMs: averageExecutionDuration,
        byStatus: executionCounts,
        failedLast24h: failedExecutionsLast24h,
        recent: recentExecutionRuns,
      },
      generatedAt: new Date().toISOString(),
      health,
      performance: this.createPerformanceSummary(performanceRuns, nodeLatencyEvents),
      pipeline: {
        byStatus: pipelineCounts,
        failedLast24h: failedPipelineLast24h,
        recent: recentPipelineJobs,
      },
      readiness: {
        checks: readiness.checks,
        failedChecks: readiness.checks.filter((check) => check.status === 'failed').length,
        status: readiness.status,
      },
    };
  }

  private createActions(): OpsAction[] {
    return [
      {
        command: 'pnpm provider:smoke',
        description: 'Validate LLM, embedding, and reranker providers with real calls.',
        id: 'provider-smoke',
        label: 'Provider Smoke',
      },
      {
        command: 'pnpm demo:seed --reset --no-graph',
        description: 'Bootstrap a stable text RAG demo dataset without graph extraction.',
        id: 'demo-seed',
        label: 'Demo Seed',
      },
      {
        command: 'pnpm batch:smoke',
        description: 'Verify upload, batch taxonomy, batch ingest, pipeline, and archive.',
        id: 'batch-smoke',
        label: 'Batch Smoke',
      },
      {
        command: 'pnpm ops:smoke',
        description: 'Verify Ops Summary aggregation against the current environment.',
        id: 'ops-smoke',
        label: 'Ops Smoke',
      },
      {
        command: 'pnpm --filter @enterprise-agentic-rag/backend search:reindex',
        description: 'Rebuild the Elasticsearch chunk index from stored chunks.',
        id: 'search-reindex',
        label: 'Search Reindex',
      },
    ];
  }

  private normalizeLimit(limit: number | undefined): number {
    if (!Number.isInteger(limit) || !limit || limit <= 0) {
      return defaultLimit;
    }

    return Math.min(limit, maxLimit);
  }

  private sumCounts(counts: Array<{ count: number }>): number {
    return counts.reduce((sum, item) => sum + item.count, 0);
  }

  private createCostSummary(events: OpsCostTraceEvent[]): OpsCostSummary {
    const currency = this.configService.getCostConfig().currency;
    const byModel = new Map<string, OpsCostByModel>();
    let promptTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let totalEstimatedCost = 0;

    for (const event of events) {
      const model = this.getString(event.metadata.llmModel) ?? 'unknown';
      const eventPromptTokens = this.getNumber(event.metadata.promptTokens);
      const eventOutputTokens = this.getNumber(event.metadata.outputTokens);
      const eventTotalTokens =
        this.getNumber(event.metadata.totalTokens) ?? eventPromptTokens + eventOutputTokens;
      const eventEstimatedCost = this.getNumber(event.metadata.estimatedCost);

      promptTokens += eventPromptTokens;
      outputTokens += eventOutputTokens;
      totalTokens += eventTotalTokens;
      totalEstimatedCost += eventEstimatedCost;

      const current = byModel.get(model) ?? {
        estimatedCost: 0,
        model,
        totalTokens: 0,
      };

      current.estimatedCost = this.roundCost(current.estimatedCost + eventEstimatedCost);
      current.totalTokens += eventTotalTokens;
      byModel.set(model, current);
    }

    return {
      byModel: [...byModel.values()].sort((left, right) => right.totalTokens - left.totalTokens),
      currency,
      outputTokens,
      promptTokens,
      totalEstimatedCost: this.roundCost(totalEstimatedCost),
      totalTokens,
    };
  }

  private createPerformanceSummary(
    runs: OpsPerformanceRun[],
    nodeEvents: OpsNodeLatencyEvent[],
  ): OpsPerformanceSummary {
    const durations = runs
      .map((run) => run.durationMs)
      .filter((durationMs): durationMs is number => typeof durationMs === 'number')
      .sort((left, right) => left - right);

    return {
      averageDurationMs: this.average(durations),
      nodeLatency: this.createNodeLatency(nodeEvents),
      p95DurationMs: this.percentile(durations, 0.95),
      slowExecutions: durations.filter((durationMs) => durationMs >= slowExecutionThresholdMs)
        .length,
    };
  }

  private createNodeLatency(events: OpsNodeLatencyEvent[]): OpsNodeLatency[] {
    const groups = new Map<string, number[]>();

    for (const event of events) {
      if (typeof event.durationMs !== 'number') {
        continue;
      }

      const node = event.node ?? event.stage;
      const durations = groups.get(node) ?? [];

      durations.push(event.durationMs);
      groups.set(node, durations);
    }

    return [...groups.entries()]
      .map(([node, durations]) => ({
        averageDurationMs: this.average(durations) ?? 0,
        count: durations.length,
        maxDurationMs: Math.max(...durations),
        node,
      }))
      .sort((left, right) => right.averageDurationMs - left.averageDurationMs)
      .slice(0, 8);
  }

  private average(values: number[]): number | null {
    if (values.length === 0) {
      return null;
    }

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private percentile(values: number[], percentile: number): number | null {
    if (values.length === 0) {
      return null;
    }

    const index = Math.min(values.length - 1, Math.ceil(values.length * percentile) - 1);

    return values[index];
  }

  private getNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private getString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private roundCost(value: number): number {
    return Number(value.toFixed(8));
  }
}
