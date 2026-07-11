import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ObservabilityService } from '../../infrastructure/observability';
import { ReadinessService } from '../../infrastructure/observability/readiness.service';
import type { OpsAction, OpsSummary, OpsSummaryOptions } from './ops.types';
import { OpsRepository } from './ops.repository';

const defaultLimit = 10;
const maxLimit = 50;
const dayMs = 24 * 60 * 60 * 1000;

@Injectable()
export class OpsService {
  constructor(
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
    ] = await Promise.all([
      this.opsRepository.countDocumentsByStatus(spaceIds),
      this.opsRepository.countPipelineJobsByStatus(spaceIds),
      this.opsRepository.countPipelineFailuresSince(spaceIds, since),
      this.opsRepository.listRecentPipelineJobs(spaceIds, limit),
      this.opsRepository.countExecutionRunsByStatus(context.userId),
      this.opsRepository.countExecutionFailuresSince(context.userId, since),
      this.opsRepository.getAverageExecutionDuration(context.userId),
      this.opsRepository.listRecentExecutionRuns(context.userId, limit),
    ]);

    return {
      actions: this.createActions(),
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
}
