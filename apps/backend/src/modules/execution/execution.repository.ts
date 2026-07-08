import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import type {
  ExecutionRunDetail,
  ExecutionRunEntity,
  ExecutionRunStatus,
  ExecutionTraceEventEntity,
  RecordExecutionTraceEventInput,
  StartExecutionRunInput,
} from './execution.types';

type ExecutionRunModel = Omit<ExecutionRunEntity, 'metadata'> & {
  metadata: unknown;
  events?: ExecutionTraceEventModel[];
};

type ExecutionTraceEventModel = Omit<ExecutionTraceEventEntity, 'metadata'> & {
  metadata: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toMetadataRecord = (metadata: unknown): Record<string, unknown> =>
  isRecord(metadata) ? metadata : {};

const toPrismaMetadata = (metadata: Record<string, unknown> = {}): Prisma.InputJsonObject =>
  metadata as Prisma.InputJsonObject;

const toExecutionRunEntity = (run: ExecutionRunModel): ExecutionRunEntity => ({
  completedAt: run.completedAt,
  conversationId: run.conversationId,
  createdAt: run.createdAt,
  durationMs: run.durationMs,
  executionId: run.executionId,
  id: run.id,
  metadata: toMetadataRecord(run.metadata),
  requestId: run.requestId,
  source: run.source,
  startedAt: run.startedAt,
  status: run.status,
  updatedAt: run.updatedAt,
  userId: run.userId,
});

const toExecutionTraceEventEntity = (
  event: ExecutionTraceEventModel,
): ExecutionTraceEventEntity => ({
  durationMs: event.durationMs,
  errorMessage: event.errorMessage,
  executionId: event.executionId,
  id: event.id,
  metadata: toMetadataRecord(event.metadata),
  node: event.node,
  requestId: event.requestId,
  sequence: event.sequence,
  stage: event.stage,
  status: event.status,
  timestamp: event.timestamp,
  type: event.type,
  userId: event.userId,
});

const toExecutionRunDetail = (run: ExecutionRunModel): ExecutionRunDetail => ({
  ...toExecutionRunEntity(run),
  events: run.events?.map(toExecutionTraceEventEntity) ?? [],
});

@Injectable()
export class ExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRun(input: StartExecutionRunInput): Promise<ExecutionRunEntity> {
    const run = await this.prisma.executionRun.create({
      data: {
        conversationId: input.conversationId,
        executionId: input.executionId,
        metadata: toPrismaMetadata(input.metadata),
        requestId: input.requestId,
        source: input.source,
        userId: input.userId,
      },
    });

    return toExecutionRunEntity(run);
  }

  async finishRun(input: {
    completedAt: Date;
    durationMs?: number;
    executionId: string;
    metadata?: Record<string, unknown>;
    status: ExecutionRunStatus;
  }): Promise<ExecutionRunEntity> {
    const run = await this.prisma.executionRun.update({
      data: {
        completedAt: input.completedAt,
        durationMs: input.durationMs,
        metadata: input.metadata ? toPrismaMetadata(input.metadata) : undefined,
        status: input.status,
      },
      where: {
        executionId: input.executionId,
      },
    });

    return toExecutionRunEntity(run);
  }

  async createEvent(
    input: RecordExecutionTraceEventInput & { sequence: number },
  ): Promise<ExecutionTraceEventEntity> {
    const event = await this.prisma.executionTraceEvent.create({
      data: {
        durationMs: input.durationMs,
        errorMessage: input.errorMessage,
        executionId: input.executionId,
        metadata: toPrismaMetadata(input.metadata),
        node: input.node,
        requestId: input.requestId,
        sequence: input.sequence,
        stage: input.stage,
        status: input.status,
        type: input.type,
        userId: input.userId,
      },
    });

    return toExecutionTraceEventEntity(event);
  }

  async countEventsByExecutionId(executionId: string): Promise<number> {
    return this.prisma.executionTraceEvent.count({
      where: {
        executionId,
      },
    });
  }

  async listRunsByUserId(userId: string, limit: number): Promise<ExecutionRunEntity[]> {
    const runs = await this.prisma.executionRun.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      where: {
        userId,
      },
    });

    return runs.map(toExecutionRunEntity);
  }

  async findRunByExecutionIdAndUserId(
    executionId: string,
    userId: string,
  ): Promise<ExecutionRunEntity | null> {
    const run = await this.prisma.executionRun.findFirst({
      where: {
        executionId,
        userId,
      },
    });

    return run ? toExecutionRunEntity(run) : null;
  }

  async findRunByExecutionId(executionId: string): Promise<ExecutionRunEntity | null> {
    const run = await this.prisma.executionRun.findUnique({
      where: {
        executionId,
      },
    });

    return run ? toExecutionRunEntity(run) : null;
  }

  async findRunDetailByExecutionIdAndUserId(
    executionId: string,
    userId: string,
  ): Promise<ExecutionRunDetail | null> {
    const run = await this.prisma.executionRun.findFirst({
      include: {
        events: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
      where: {
        executionId,
        userId,
      },
    });

    return run ? toExecutionRunDetail(run) : null;
  }

  async listEventsByExecutionIdAndUserId(
    executionId: string,
    userId: string,
  ): Promise<ExecutionTraceEventEntity[]> {
    const events = await this.prisma.executionTraceEvent.findMany({
      orderBy: {
        sequence: 'asc',
      },
      where: {
        executionId,
        userId,
      },
    });

    return events.map(toExecutionTraceEventEntity);
  }
}
