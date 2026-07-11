import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type {
  OpsCostTraceEvent,
  OpsCountByStatus,
  OpsExecutionRun,
  OpsNodeLatencyEvent,
  OpsPerformanceRun,
  OpsPipelineJob,
} from './ops.types';

type AccessibleSpaceInput = {
  tenantId?: string;
  userId: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toMetadataRecord = (metadata: unknown): Record<string, unknown> =>
  isRecord(metadata) ? metadata : {};

@Injectable()
export class OpsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAccessibleSpaceIds(input: AccessibleSpaceInput): Promise<string[]> {
    const spaces = await this.prisma.knowledgeSpace.findMany({
      select: {
        id: true,
      },
      where: {
        members: {
          some: {
            userId: input.userId,
          },
        },
        status: 'ACTIVE',
        tenantId: input.tenantId ?? null,
      },
    });

    return spaces.map((space) => space.id);
  }

  async countDocumentsByStatus(spaceIds: string[]): Promise<OpsCountByStatus[]> {
    if (spaceIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.document.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
      where: {
        spaceId: {
          in: spaceIds,
        },
      },
    });

    return rows.map((row) => ({
      count: row._count._all,
      status: row.status,
    }));
  }

  async countPipelineJobsByStatus(spaceIds: string[]): Promise<OpsCountByStatus[]> {
    if (spaceIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.pipelineJob.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
      where: {
        spaceId: {
          in: spaceIds,
        },
      },
    });

    return rows.map((row) => ({
      count: row._count._all,
      status: row.status,
    }));
  }

  async countPipelineFailuresSince(spaceIds: string[], since: Date): Promise<number> {
    if (spaceIds.length === 0) {
      return 0;
    }

    return this.prisma.pipelineJob.count({
      where: {
        createdAt: {
          gte: since,
        },
        spaceId: {
          in: spaceIds,
        },
        status: 'FAILED',
      },
    });
  }

  async listRecentPipelineJobs(spaceIds: string[], limit: number): Promise<OpsPipelineJob[]> {
    if (spaceIds.length === 0) {
      return [];
    }

    const jobs = await this.prisma.pipelineJob.findMany({
      include: {
        document: {
          select: {
            id: true,
            status: true,
            title: true,
            type: true,
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            errorMessage: true,
          },
          take: 1,
          where: {
            status: 'FAILED',
          },
        },
        space: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      where: {
        spaceId: {
          in: spaceIds,
        },
      },
    });

    return jobs.map((job) => ({
      document: {
        id: job.document.id,
        status: job.document.status,
        title: job.document.title,
        type: job.document.type,
      },
      errorMessage: job.events[0]?.errorMessage ?? null,
      finishedAt: job.finishedAt,
      id: job.id,
      space: {
        id: job.space.id,
        name: job.space.name,
      },
      startedAt: job.startedAt,
      status: job.status,
    }));
  }

  async countExecutionRunsByStatus(userId: string): Promise<OpsCountByStatus[]> {
    const rows = await this.prisma.executionRun.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
      where: {
        userId,
      },
    });

    return rows.map((row) => ({
      count: row._count._all,
      status: row.status,
    }));
  }

  countExecutionFailuresSince(userId: string, since: Date): Promise<number> {
    return this.prisma.executionRun.count({
      where: {
        createdAt: {
          gte: since,
        },
        status: 'FAILED',
        userId,
      },
    });
  }

  async getAverageExecutionDuration(userId: string): Promise<number | null> {
    const result = await this.prisma.executionRun.aggregate({
      _avg: {
        durationMs: true,
      },
      where: {
        durationMs: {
          not: null,
        },
        userId,
      },
    });

    return result._avg.durationMs === null ? null : Math.round(result._avg.durationMs);
  }

  async listRecentExecutionRuns(userId: string, limit: number): Promise<OpsExecutionRun[]> {
    const runs = await this.prisma.executionRun.findMany({
      orderBy: {
        startedAt: 'desc',
      },
      select: {
        completedAt: true,
        durationMs: true,
        executionId: true,
        id: true,
        source: true,
        startedAt: true,
        status: true,
      },
      take: limit,
      where: {
        userId,
      },
    });

    return runs;
  }

  async listCostTraceEvents(userId: string, limit: number): Promise<OpsCostTraceEvent[]> {
    const events = await this.prisma.executionTraceEvent.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        metadata: true,
      },
      take: limit,
      where: {
        stage: 'answer',
        status: 'SUCCEEDED',
        type: 'answer',
        userId,
      },
    });

    return events.map((event) => ({
      metadata: toMetadataRecord(event.metadata),
    }));
  }

  async listPerformanceRuns(userId: string, limit: number): Promise<OpsPerformanceRun[]> {
    return this.prisma.executionRun.findMany({
      orderBy: {
        startedAt: 'desc',
      },
      select: {
        durationMs: true,
      },
      take: limit,
      where: {
        durationMs: {
          not: null,
        },
        userId,
      },
    });
  }

  async listNodeLatencyEvents(userId: string, limit: number): Promise<OpsNodeLatencyEvent[]> {
    return this.prisma.executionTraceEvent.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        durationMs: true,
        node: true,
        stage: true,
      },
      take: limit,
      where: {
        durationMs: {
          not: null,
        },
        status: {
          in: ['SUCCEEDED', 'FAILED'],
        },
        userId,
      },
    });
  }
}
