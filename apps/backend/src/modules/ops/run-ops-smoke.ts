import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import { ExecutionService } from '../execution';
import { UserRepository, type UserRecord } from '../user';
import { OpsService } from './ops.service';

const smokeEmail = globalThis.process.env.OPS_SMOKE_EMAIL ?? 'admin@example.com';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const opsService = app.get(OpsService);
    const configService = app.get(ConfigService);
    const executionService = app.get(ExecutionService);
    const userRepository = app.get(UserRepository);
    const user = await userRepository.findByEmail(smokeEmail);

    if (!user) {
      throw new Error(`Ops smoke user not found: ${smokeEmail}. Run pnpm db:seed first.`);
    }

    const context = toExecutionContext(user);

    await createSyntheticCostExecution(executionService, configService, context);

    const summary = await opsService.getSummary(context, {
      limit: 5,
    });

    if (!summary.health || summary.health.status !== 'ok') {
      throw new Error('Ops smoke expected liveness health to be ok');
    }

    if (!summary.readiness.checks.length) {
      throw new Error('Ops smoke expected readiness checks');
    }

    if (!summary.actions.some((action) => action.id === 'ops-smoke')) {
      throw new Error('Ops smoke expected smoke actions');
    }

    if (summary.cost.totalTokens <= 0) {
      throw new Error('Ops smoke expected cost token aggregation');
    }

    if (!summary.performance.nodeLatency.length) {
      throw new Error('Ops smoke expected node latency aggregation');
    }

    console.log(
      JSON.stringify(
        {
          actionCount: summary.actions.length,
          cost: {
            currency: summary.cost.currency,
            totalEstimatedCost: summary.cost.totalEstimatedCost,
            totalTokens: summary.cost.totalTokens,
          },
          documentTotal: summary.documents.total,
          executionRecentCount: summary.executions.recent.length,
          failedExecutionsLast24h: summary.executions.failedLast24h,
          failedPipelineLast24h: summary.pipeline.failedLast24h,
          generatedAt: summary.generatedAt,
          pipelineRecentCount: summary.pipeline.recent.length,
          performance: {
            averageDurationMs: summary.performance.averageDurationMs,
            nodeLatencyCount: summary.performance.nodeLatency.length,
            p95DurationMs: summary.performance.p95DurationMs,
            slowExecutions: summary.performance.slowExecutions,
          },
          readiness: {
            failedChecks: summary.readiness.failedChecks,
            status: summary.readiness.status,
            totalChecks: summary.readiness.checks.length,
          },
          userEmail: smokeEmail,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

function toExecutionContext(user: UserRecord): ExecutionContext {
  return {
    departmentId: user.departmentId ?? undefined,
    metadata: {
      source: 'ops-smoke',
    },
    organizationId: user.organizationId ?? undefined,
    permissions: unique(user.roles.flatMap((role) => role.permissions)),
    roles: user.roles.map((role) => role.code),
    spaceIds: user.spaceIds,
    tenantId: user.tenantId ?? undefined,
    userId: user.id,
  };
}

async function createSyntheticCostExecution(
  executionService: ExecutionService,
  configService: ConfigService,
  context: ExecutionContext,
): Promise<void> {
  const executionId = randomUUID();
  const requestId = randomUUID();
  const costConfig = configService.getCostConfig();
  const promptTokens = 120;
  const outputTokens = 48;
  const estimatedCost =
    (promptTokens / 1000) * costConfig.llmInputPer1kTokens +
    (outputTokens / 1000) * costConfig.llmOutputPer1kTokens;

  await executionService.startRun({
    executionId,
    metadata: {
      source: 'ops-smoke',
    },
    requestId,
    source: 'ops-smoke',
    userId: context.userId,
  });
  await executionService.recordEvent({
    durationMs: 35,
    executionId,
    metadata: {
      citationCount: 0,
      currency: costConfig.currency,
      estimatedCost: Number(estimatedCost.toFixed(8)),
      llmModel: configService.getLlmConfig().model,
      outputTokens,
      promptTokens,
      totalTokens: promptTokens + outputTokens,
    },
    node: 'answer',
    requestId,
    stage: 'answer',
    status: 'SUCCEEDED',
    type: 'answer',
    userId: context.userId,
  });
  await executionService.finishRun({
    durationMs: 120,
    executionId,
    metadata: {
      usedGraph: false,
      usedMemory: false,
      usedRetrieval: false,
      verified: true,
    },
    status: 'SUCCEEDED',
  });
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Ops smoke failed');
  globalThis.process.exitCode = 1;
});
