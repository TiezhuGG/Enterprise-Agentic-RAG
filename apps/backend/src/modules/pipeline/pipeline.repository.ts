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
} from './pipeline.types';

type PipelineJobModel = Omit<PipelineJobEntity, 'metadata'> & {
  metadata: unknown;
  events?: PipelineEventModel[];
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

@Injectable()
export class PipelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(input: CreatePipelineJobInput): Promise<PipelineJobEntity> {
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
  }

  async finishJob(jobId: string, status: PipelineJobStatus): Promise<PipelineJobEntity> {
    const job = await this.prisma.pipelineJob.update({
      data: {
        finishedAt: new Date(),
        status,
      },
      where: {
        id: jobId,
      },
    });

    return toPipelineJobEntity(job);
  }

  async claimNextQueuedJob(): Promise<PipelineJobEntity | null> {
    const queuedJob = await this.prisma.pipelineJob.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      where: {
        status: 'QUEUED',
      },
    });

    if (!queuedJob) {
      return null;
    }

    const result = await this.prisma.pipelineJob.updateMany({
      data: {
        finishedAt: null,
        startedAt: new Date(),
        status: 'RUNNING',
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
