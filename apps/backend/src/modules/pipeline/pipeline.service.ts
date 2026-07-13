import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { DocumentRepository, type DocumentEntity } from '../document';
import { KnowledgeSpaceRepository, type SpaceMemberRole } from '../knowledge-space';
import { PipelineRepository } from './pipeline.repository';
import { pipelineJobStatuses } from './pipeline.types';
import type {
  PipelineEventEntity,
  PipelineEventStatus,
  PipelineJobDetail,
  PipelineJobEntity,
  PipelineJobStatus,
  SpacePipelineJobList,
  RecordPipelineStageInput,
} from './pipeline.types';

const readRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR', 'VIEWER'];
const writeRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR'];
const defaultJobListLimit = 20;
const maxJobListLimit = 100;
const maxStringLength = 240;
const sensitiveKeyPattern =
  /authorization|api[-_]?key|secret|password|prompt|answer|buffer|messages|token/i;
const sensitiveExactKeys = new Set([
  'content',
  'rawcontent',
  'cleanedcontent',
  'text',
  'file',
  'object',
  'objectbuffer',
]);

@Injectable()
export class PipelineService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly knowledgeSpaceRepository: KnowledgeSpaceRepository,
    private readonly pipelineRepository: PipelineRepository,
  ) {}

  async startDocumentJob(
    context: ExecutionContext,
    document: DocumentEntity,
    metadata: Record<string, unknown> = {},
  ): Promise<PipelineJobEntity> {
    return this.createDocumentJob(context, document, 'RUNNING', metadata);
  }

  async startQueuedDocumentJob(
    context: ExecutionContext,
    document: DocumentEntity,
    metadata: Record<string, unknown> = {},
  ): Promise<PipelineJobEntity> {
    const activeJob = await this.pipelineRepository.findActiveJobByDocumentId(document.id);

    if (activeJob) {
      return activeJob;
    }

    return this.createDocumentJob(context, document, 'QUEUED', metadata);
  }

  async claimNextQueuedJob(
    workerId: string,
    leaseDurationMs: number,
  ): Promise<PipelineJobEntity | null> {
    return this.pipelineRepository.claimNextQueuedJob(workerId, leaseDurationMs);
  }

  async extendLease(jobId: string, workerId: string, leaseDurationMs: number): Promise<boolean> {
    return this.pipelineRepository.extendLease(jobId, workerId, leaseDurationMs);
  }

  async findActiveDocumentJob(documentId: string): Promise<PipelineJobEntity | null> {
    return this.pipelineRepository.findActiveJobByDocumentId(documentId);
  }

  async recoverExpiredLeases(): Promise<number> {
    const jobs = await this.pipelineRepository.recoverExpiredLeases();

    await Promise.all(
      jobs.map(async (job) => {
        await this.recordStageEvent(job, {
          durationMs: 0,
          metadata: {
            reason: 'worker-lease-expired',
          },
          stage: 'queue-worker',
          status: 'skipped',
        });
      }),
    );

    return jobs.length;
  }

  async scheduleRetry(job: PipelineJobEntity, delayMs: number): Promise<PipelineJobEntity> {
    const retryAt = new Date(Date.now() + delayMs);
    const scheduled = await this.pipelineRepository.scheduleRetry(job.id, retryAt);
    await this.recordStageEvent(scheduled, {
      durationMs: 0,
      metadata: {
        attempt: scheduled.attemptCount,
        retryAt: retryAt.toISOString(),
      },
      stage: 'queue-retry',
      status: 'skipped',
    });
    return scheduled;
  }

  private async createDocumentJob(
    context: ExecutionContext,
    document: DocumentEntity,
    status: PipelineJobStatus,
    metadata: Record<string, unknown> = {},
  ): Promise<PipelineJobEntity> {
    return this.pipelineRepository.createJob({
      documentId: document.id,
      executionId: this.getMetadataString(context, 'executionId'),
      metadata: this.sanitizeMetadata({
        documentStatus: document.status,
        documentType: document.type,
        ...metadata,
      }),
      requestId: this.getMetadataString(context, 'requestId'),
      spaceId: document.spaceId,
      status,
      triggeredBy: context.userId,
    });
  }

  async recordStageEvent(
    job: PipelineJobEntity,
    input: RecordPipelineStageInput,
  ): Promise<PipelineEventEntity> {
    return this.pipelineRepository.createEvent({
      documentId: job.documentId,
      durationMs: input.durationMs,
      errorMessage: input.errorMessage,
      jobId: job.id,
      metadata: this.sanitizeMetadata(input.metadata ?? {}),
      spaceId: job.spaceId,
      stage: input.stage,
      status: this.toPipelineEventStatus(input.status),
    });
  }

  async finishJob(jobId: string, status: PipelineJobStatus): Promise<PipelineJobEntity> {
    return this.pipelineRepository.finishJob(jobId, status);
  }

  async listDocumentJobs(
    context: ExecutionContext,
    documentId: string,
    limit?: string,
  ): Promise<PipelineJobEntity[]> {
    const document = await this.findReadableDocument(context, documentId);

    return this.pipelineRepository.listJobsByDocumentId(document.id, this.normalizeLimit(limit));
  }

  async listSpaceJobs(
    context: ExecutionContext,
    spaceId: string,
    options: { cursor?: string; limit?: string; status?: string },
  ): Promise<SpacePipelineJobList> {
    await this.ensureReadableSpace(context, spaceId);

    return this.pipelineRepository.listJobsBySpaceId(spaceId, {
      cursor: options.cursor,
      limit: this.normalizeLimit(options.limit),
      status: this.normalizeJobStatus(options.status),
    });
  }
  async getJob(context: ExecutionContext, jobId: string): Promise<PipelineJobDetail> {
    const job = await this.pipelineRepository.findJobDetailById(jobId);

    if (!job) {
      throw new NotFoundException('Pipeline job not found');
    }

    await this.ensureReadableSpace(context, job.spaceId);

    return job;
  }

  async listJobEvents(context: ExecutionContext, jobId: string): Promise<PipelineEventEntity[]> {
    const job = await this.pipelineRepository.findJobById(jobId);

    if (!job) {
      throw new NotFoundException('Pipeline job not found');
    }

    await this.ensureReadableSpace(context, job.spaceId);

    return this.pipelineRepository.listEventsByJobId(job.id);
  }

  async cancelQueuedJob(context: ExecutionContext, jobId: string): Promise<PipelineJobEntity> {
    const job = await this.pipelineRepository.findJobById(jobId);

    if (!job) throw new NotFoundException('Pipeline job not found');

    await this.ensureWritableSpace(context, job.spaceId);
    const canceled = await this.pipelineRepository.cancelQueuedJob(job.id);

    if (!canceled) {
      throw new BadRequestException('Only queued pipeline jobs can be canceled');
    }

    await this.recordStageEvent(canceled, {
      durationMs: 0,
      metadata: { reason: 'canceled-by-user' },
      stage: 'queue',
      status: 'skipped',
    });

    return canceled;
  }

  private async findReadableDocument(
    context: ExecutionContext,
    documentId: string,
  ): Promise<DocumentEntity> {
    const document = await this.documentRepository.findActiveById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.ensureReadableSpace(context, document.spaceId);

    return document;
  }

  private async ensureReadableSpace(context: ExecutionContext, spaceId: string): Promise<void> {
    const space = await this.knowledgeSpaceRepository.findAccessibleById(
      spaceId,
      context.userId,
      context.tenantId,
    );

    if (!space) {
      throw new NotFoundException('Knowledge space not found');
    }

    const member = space.members.find((spaceMember) => spaceMember.userId === context.userId);

    if (!member || !readRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient knowledge space role');
    }
  }

  private async ensureWritableSpace(context: ExecutionContext, spaceId: string): Promise<void> {
    const space = await this.knowledgeSpaceRepository.findAccessibleById(
      spaceId,
      context.userId,
      context.tenantId,
    );
    const member = space?.members.find((spaceMember) => spaceMember.userId === context.userId);

    if (!member || !writeRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient knowledge space role');
    }
  }

  private normalizeLimit(limit: string | undefined): number {
    const parsedLimit = limit ? Number(limit) : defaultJobListLimit;

    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return defaultJobListLimit;
    }

    return Math.min(parsedLimit, maxJobListLimit);
  }

  private normalizeJobStatus(status: string | undefined): PipelineJobStatus | undefined {
    if (!status) {
      return undefined;
    }

    if (!pipelineJobStatuses.includes(status as PipelineJobStatus)) {
      throw new BadRequestException('Invalid pipeline job status');
    }

    return status as PipelineJobStatus;
  }
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    return this.sanitizeRecord(metadata, 0);
  }

  private sanitizeRecord(
    metadata: Record<string, unknown>,
    depth: number,
  ): Record<string, unknown> {
    if (depth > 3) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(metadata)
        .filter(([key]) => !this.isSensitiveKey(key))
        .map(([key, value]) => [key, this.sanitizeValue(value, depth + 1)])
        .filter(([, value]) => value !== undefined),
    );
  }

  private sanitizeValue(value: unknown, depth: number): unknown {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.length > maxStringLength ? `${value.slice(0, maxStringLength)}...` : value;
    }

    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item) => this.sanitizeValue(item, depth + 1));
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeRecord(value as Record<string, unknown>, depth + 1);
    }

    return undefined;
  }

  private isSensitiveKey(key: string): boolean {
    const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    return sensitiveExactKeys.has(normalizedKey) || sensitiveKeyPattern.test(key);
  }

  private getMetadataString(context: ExecutionContext, key: string): string | undefined {
    const value = context.metadata[key];

    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private toPipelineEventStatus(status: RecordPipelineStageInput['status']): PipelineEventStatus {
    if (status === 'failed') {
      return 'FAILED';
    }

    if (status === 'skipped') {
      return 'SKIPPED';
    }

    return 'SUCCEEDED';
  }
}
