import { Injectable, NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ExecutionRepository } from './execution.repository';
import type {
  ExecutionRunDetail,
  ExecutionRunEntity,
  ExecutionTraceEventEntity,
  FinishExecutionRunInput,
  ListExecutionsOptions,
  RecordExecutionTraceEventInput,
  StartExecutionRunInput,
} from './execution.types';

const defaultExecutionListLimit = 20;
const maxExecutionListLimit = 100;
const maxErrorMessageLength = 500;

const allowedMetadataKeys = new Set([
  'attachmentCount',
  'citationCount',
  'count',
  'currency',
  'contextBuilderDurationMs',
  'contextCount',
  'durationMs',
  'errorType',
  'estimatedCost',
  'filteredCount',
  'graphCount',
  'graphDurationMs',
  'graphStatus',
  'hasQueryRewrite',
  'hasSummary',
  'iteration',
  'keywordLimit',
  'latency',
  'limit',
  'llmModel',
  'maxContextTokens',
  'maxIterations',
  'memoryLongTermCount',
  'memoryShortTermCount',
  'needsGraph',
  'needsMoreContext',
  'needsRetrieval',
  'outputTokens',
  'permissionFilterDurationMs',
  'promptTokens',
  'reason',
  'rerankedCount',
  'rerankerDurationMs',
  'retrievalCount',
  'retrievalDurationMs',
  'rrfCount',
  'rrfDurationMs',
  'scopedSpaceCount',
  'status',
  'totalTokens',
  'usedGraph',
  'usedMemory',
  'usedRetrieval',
  'vectorLimit',
  'keywordCount',
  'keywordDurationMs',
  'vectorCount',
  'vectorDurationMs',
  'verified',
]);

@Injectable()
export class ExecutionService {
  private readonly eventSequences = new Map<string, number>();

  constructor(private readonly executionRepository: ExecutionRepository) {}

  async startRun(input: StartExecutionRunInput): Promise<ExecutionRunEntity> {
    const run = await this.executionRepository.createRun({
      ...input,
      metadata: this.sanitizeMetadata(input.metadata ?? {}),
    });

    this.eventSequences.set(input.executionId, 0);

    await this.recordEvent({
      executionId: input.executionId,
      metadata: {
        status: 'running',
      },
      requestId: input.requestId,
      stage: 'workflow',
      status: 'STARTED',
      type: 'workflow',
      userId: input.userId,
    });

    return run;
  }

  async finishRun(input: FinishExecutionRunInput): Promise<ExecutionRunEntity> {
    const existingRun = await this.executionRepository.findRunByExecutionId(input.executionId);

    if (!existingRun) {
      throw new NotFoundException('Execution run not found');
    }

    await this.recordEvent({
      errorMessage: input.errorMessage,
      executionId: input.executionId,
      metadata: {
        ...(input.metadata ?? {}),
        durationMs: input.durationMs,
        status: input.status.toLowerCase(),
      },
      requestId: existingRun.requestId,
      stage: 'workflow',
      status: input.status === 'SUCCEEDED' ? 'SUCCEEDED' : 'FAILED',
      type: 'workflow',
      userId: existingRun.userId,
    });

    const run = await this.executionRepository.finishRun({
      completedAt: new Date(),
      durationMs: input.durationMs,
      executionId: input.executionId,
      metadata: this.sanitizeMetadata({
        ...existingRun.metadata,
        ...(input.metadata ?? {}),
      }),
      status: input.status,
    });

    this.eventSequences.delete(input.executionId);

    return run;
  }

  async recordEvent(input: RecordExecutionTraceEventInput): Promise<ExecutionTraceEventEntity> {
    const sequence = await this.nextSequence(input.executionId);

    return this.executionRepository.createEvent({
      ...input,
      errorMessage: this.sanitizeErrorMessage(input.errorMessage),
      metadata: this.sanitizeMetadata(input.metadata ?? {}),
      sequence,
    });
  }

  async listRuns(
    context: ExecutionContext,
    options: ListExecutionsOptions = {},
  ): Promise<ExecutionRunEntity[]> {
    return this.executionRepository.listRunsByUserId(
      context.userId,
      this.normalizeLimit(options.limit),
    );
  }

  async getRun(context: ExecutionContext, executionId: string): Promise<ExecutionRunDetail> {
    const run = await this.executionRepository.findRunDetailByExecutionIdAndUserId(
      executionId,
      context.userId,
    );

    if (!run) {
      throw new NotFoundException('Execution run not found');
    }

    return run;
  }

  async getTimeline(
    context: ExecutionContext,
    executionId: string,
  ): Promise<ExecutionTraceEventEntity[]> {
    const run = await this.executionRepository.findRunByExecutionIdAndUserId(
      executionId,
      context.userId,
    );

    if (!run) {
      throw new NotFoundException('Execution run not found');
    }

    return this.executionRepository.listEventsByExecutionIdAndUserId(executionId, context.userId);
  }

  private async nextSequence(executionId: string): Promise<number> {
    const currentSequence = this.eventSequences.get(executionId);

    if (currentSequence !== undefined) {
      const nextSequence = currentSequence + 1;

      this.eventSequences.set(executionId, nextSequence);

      return nextSequence;
    }

    const persistedCount = await this.executionRepository.countEventsByExecutionId(executionId);
    const nextSequence = persistedCount + 1;

    this.eventSequences.set(executionId, nextSequence);

    return nextSequence;
  }

  private normalizeLimit(limit: number | undefined): number {
    if (!Number.isInteger(limit) || !limit || limit <= 0) {
      return defaultExecutionListLimit;
    }

    return Math.min(limit, maxExecutionListLimit);
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(metadata)
        .filter(([key]) => allowedMetadataKeys.has(key))
        .map(([key, value]) => [key, this.sanitizeMetadataValue(value)])
        .filter(([, value]) => value !== undefined),
    );
  }

  private sanitizeMetadataValue(value: unknown): unknown {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.length > 120 ? `${value.slice(0, 120)}...` : value;
    }

    return undefined;
  }

  private sanitizeErrorMessage(errorMessage: string | undefined): string | undefined {
    if (!errorMessage) {
      return undefined;
    }

    return errorMessage.length > maxErrorMessageLength
      ? `${errorMessage.slice(0, maxErrorMessageLength)}...`
      : errorMessage;
  }
}
