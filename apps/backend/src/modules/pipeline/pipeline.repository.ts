import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import type {
  CreatePipelineEventInput,
  CreatePipelineJobInput,
  PipelineEventEntity,
  PipelineJobDetail,
  PipelineJobEntity,
  PipelineJobStatus,
  SpacePipelineJobEntity,
  SpacePipelineJobList,
} from './pipeline.types';

type PipelineJobModel = Omit<PipelineJobEntity, 'metadata'> & {
  metadata: unknown;
  events?: PipelineEventModel[];
};

type PipelineJobWithDocumentModel = PipelineJobModel & {
  document: {
    id: string;
    status: string;
    title: string;
    type: string;
  };
};

type PipelineEventModel = Omit<PipelineEventEntity, 'metadata'> & {
  metadata: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toMetadataRecord = (metadata: unknown): Record<string, unknown> =>
  isRecord(metadata) ? metadata : {};

const toPrismaMetadata = (metadata: Record<string, unknown> = {}): Prisma.InputJsonObject =>
  metadata as Prisma.InputJsonObject;

const toPipelineJobEntity = (job: PipelineJobModel): PipelineJobEntity => ({
  id: job.id,
  documentId: job.documentId,
  spaceId: job.spaceId,
  executionId: job.executionId,
  requestId: job.requestId,
  triggeredBy: job.triggeredBy,
  status: job.status,
  workerId: job.workerId,
  leaseExpiresAt: job.leaseExpiresAt,
  attemptCount: job.attemptCount,
  nextRetryAt: job.nextRetryAt,
  metadata: toMetadataRecord(job.metadata),
  startedAt: job.startedAt,
  finishedAt: job.finishedAt,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
});

const toPipelineEventEntity = (event: PipelineEventModel): PipelineEventEntity => ({
  id: event.id,
  jobId: event.jobId,
  documentId: event.documentId,
  spaceId: event.spaceId,
  stage: event.stage,
  status: event.status,
  durationMs: event.durationMs,
  metadata: toMetadataRecord(event.metadata),
  errorMessage: event.errorMessage,
  createdAt: event.createdAt,
});

const toPipelineJobDetail = (job: PipelineJobModel): PipelineJobDetail => ({
  ...toPipelineJobEntity(job),
  events: job.events?.map(toPipelineEventEntity) ?? [],
});

const toSpacePipelineJobEntity = (
  job: PipelineJobWithDocumentModel,
): SpacePipelineJobEntity => ({
  ...toPipelineJobEntity(job),
  document: job.document,
  graphEvent: null,
  latestEvent: job.events?.[0] ? toPipelineEventEntity(job.events[0]) : null,
});

@Injectable()
export class PipelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(input: CreatePipelineJobInput): Promise<PipelineJobEntity> {
    try {
      const job = await this.prisma.pipelineJob.create({
        data: {
          documentId: input.documentId,
          executionId: input.executionId,
          metadata: toPrismaMetadata(input.metadata),
          requestId: input.requestId,
          spaceId: input.spaceId,
          status: input.status,
          triggeredBy: input.triggeredBy,
        },
      });

      return toPipelineJobEntity(job);
    } catch (error) {
      if (this.isActiveJobConstraintError(error)) {
        const existing = await this.findActiveJobByDocumentId(input.documentId);
        if (existing) return existing;
      }

      throw error;
    }
  }

  async finishJob(jobId: string, status: PipelineJobStatus): Promise<PipelineJobEntity> {
    const job = await this.prisma.pipelineJob.update({
      data: {
        finishedAt: new Date(),
        leaseExpiresAt: null,
        nextRetryAt: null,
        status,
        workerId: null,
      },
      where: {
        id: jobId,
      },
    });

    return toPipelineJobEntity(job);
  }

  async claimNextQueuedJob(workerId: string, leaseDurationMs: number): Promise<PipelineJobEntity | null> {
    const now = new Date();
    const queuedJob = await this.prisma.pipelineJob.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      where: {
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
        status: 'QUEUED',
      },
    });

    if (!queuedJob) {
      return null;
    }

    const result = await this.prisma.pipelineJob.updateMany({
      data: {
        attemptCount: { increment: 1 },
        finishedAt: null,
        leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
        nextRetryAt: null,
        startedAt: now,
        status: 'RUNNING',
        workerId,
      },
      where: {
        id: queuedJob.id,
        status: 'QUEUED',
      },
    });

    if (result.count === 0) {
      return null;
    }

    const job = await this.prisma.pipelineJob.findUnique({
      where: {
        id: queuedJob.id,
      },
    });

    return job ? toPipelineJobEntity(job) : null;
  }

  async extendLease(jobId: string, workerId: string, leaseDurationMs: number): Promise<boolean> {
    const result = await this.prisma.pipelineJob.updateMany({
      data: {
        leaseExpiresAt: new Date(Date.now() + leaseDurationMs),
      },
      where: {
        id: jobId,
        status: 'RUNNING',
        workerId,
      },
    });

    return result.count === 1;
  }

  async recoverExpiredLeases(): Promise<PipelineJobEntity[]> {
    const now = new Date();
    const jobs = await this.prisma.pipelineJob.findMany({
      where: {
        leaseExpiresAt: { lte: now },
        status: 'RUNNING',
      },
    });

    if (jobs.length === 0) {
      return [];
    }

    await this.prisma.pipelineJob.updateMany({
      data: {
        finishedAt: null,
        leaseExpiresAt: null,
        nextRetryAt: now,
        status: 'QUEUED',
        workerId: null,
      },
      where: {
        id: { in: jobs.map((job) => job.id) },
        leaseExpiresAt: { lte: now },
        status: 'RUNNING',
      },
    });

    return jobs.map(toPipelineJobEntity);
  }

  async scheduleRetry(jobId: string, retryAt: Date): Promise<PipelineJobEntity> {
    const job = await this.prisma.pipelineJob.update({
      data: {
        finishedAt: null,
        leaseExpiresAt: null,
        nextRetryAt: retryAt,
        status: 'QUEUED',
        workerId: null,
      },
      where: { id: jobId },
    });

    return toPipelineJobEntity(job);
  }

  async cancelQueuedJob(jobId: string): Promise<PipelineJobEntity | null> {
    const result = await this.prisma.pipelineJob.updateMany({
      data: {
        finishedAt: new Date(),
        leaseExpiresAt: null,
        nextRetryAt: null,
        status: 'CANCELED',
        workerId: null,
      },
      where: {
        id: jobId,
        status: 'QUEUED',
      },
    });

    if (result.count === 0) return null;

    const job = await this.prisma.pipelineJob.findUnique({ where: { id: jobId } });
    return job ? toPipelineJobEntity(job) : null;
  }

  async findActiveJobByDocumentId(documentId: string): Promise<PipelineJobEntity | null> {
    const job = await this.prisma.pipelineJob.findFirst({
      orderBy: { createdAt: 'desc' },
      where: {
        documentId,
        status: { in: ['QUEUED', 'RUNNING'] },
      },
    });

    return job ? toPipelineJobEntity(job) : null;
  }

  private isActiveJobConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }

  async createEvent(input: CreatePipelineEventInput): Promise<PipelineEventEntity> {
    const event = await this.prisma.pipelineEvent.create({
      data: {
        documentId: input.documentId,
        durationMs: input.durationMs,
        errorMessage: input.errorMessage,
        jobId: input.jobId,
        metadata: toPrismaMetadata(input.metadata),
        spaceId: input.spaceId,
        stage: input.stage,
        status: input.status,
      },
    });

    return toPipelineEventEntity(event);
  }

  async listJobsByDocumentId(documentId: string, limit: number): Promise<PipelineJobEntity[]> {
    const jobs = await this.prisma.pipelineJob.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      where: {
        documentId,
      },
    });

    return jobs.map(toPipelineJobEntity);
  }

  async listJobsBySpaceId(
    spaceId: string,
    options: { cursor?: string; limit: number; status?: PipelineJobStatus },
  ): Promise<SpacePipelineJobList> {
    const jobs = await this.prisma.pipelineJob.findMany({
      cursor: options.cursor ? { id: options.cursor } : undefined,
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
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: options.cursor ? 1 : undefined,
      take: options.limit + 1,
      where: {
        spaceId,
        status: options.status,
      },
    });
    const hasNextPage = jobs.length > options.limit;
    const items = (hasNextPage ? jobs.slice(0, options.limit) : jobs).map(
      toSpacePipelineJobEntity,
    );
    const graphEvents = items.length
      ? await this.prisma.pipelineEvent.findMany({
          orderBy: { createdAt: 'desc' },
          where: {
            jobId: { in: items.map((item) => item.id) },
            stage: 'graph-extraction',
          },
        })
      : [];
    const graphEventsByJobId = new Map<string, PipelineEventEntity>();

    for (const event of graphEvents) {
      if (!graphEventsByJobId.has(event.jobId)) {
        graphEventsByJobId.set(event.jobId, toPipelineEventEntity(event));
      }
    }

    return {
      items: items.map((item) => ({
        ...item,
        graphEvent: graphEventsByJobId.get(item.id) ?? null,
      })),
      nextCursor: hasNextPage ? items.at(-1)?.id ?? null : null,
    };
  }
  async findJobById(jobId: string): Promise<PipelineJobEntity | null> {
    const job = await this.prisma.pipelineJob.findUnique({
      where: {
        id: jobId,
      },
    });

    return job ? toPipelineJobEntity(job) : null;
  }

  async findJobDetailById(jobId: string): Promise<PipelineJobDetail | null> {
    const job = await this.prisma.pipelineJob.findUnique({
      include: {
        events: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      where: {
        id: jobId,
      },
    });

    return job ? toPipelineJobDetail(job) : null;
  }

  async listEventsByJobId(jobId: string): Promise<PipelineEventEntity[]> {
    const events = await this.prisma.pipelineEvent.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      where: {
        jobId,
      },
    });

    return events.map(toPipelineEventEntity);
  }

  async listRunningJobs(limit: number): Promise<PipelineJobEntity[]> {
    const jobs = await this.prisma.pipelineJob.findMany({
      orderBy: {
        startedAt: 'asc',
      },
      take: limit,
      where: {
        status: 'RUNNING',
      },
    });

    return jobs.map(toPipelineJobEntity);
  }
}
