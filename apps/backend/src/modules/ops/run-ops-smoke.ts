import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import type { ExecutionContext } from '../../common';
import { UserRepository, type UserRecord } from '../user';
import { OpsService } from './ops.service';

const smokeEmail = globalThis.process.env.OPS_SMOKE_EMAIL ?? 'admin@example.com';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const opsService = app.get(OpsService);
    const userRepository = app.get(UserRepository);
    const user = await userRepository.findByEmail(smokeEmail);

    if (!user) {
      throw new Error(`Ops smoke user not found: ${smokeEmail}. Run pnpm db:seed first.`);
    }

    const summary = await opsService.getSummary(toExecutionContext(user), {
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

    console.log(
      JSON.stringify(
        {
          actionCount: summary.actions.length,
          documentTotal: summary.documents.total,
          executionRecentCount: summary.executions.recent.length,
          failedExecutionsLast24h: summary.executions.failedLast24h,
          failedPipelineLast24h: summary.pipeline.failedLast24h,
          generatedAt: summary.generatedAt,
          pipelineRecentCount: summary.pipeline.recent.length,
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

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Ops smoke failed');
  globalThis.process.exitCode = 1;
});
