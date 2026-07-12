import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import {
  createAppBadRequestException,
  createAppServiceUnavailableException,
  toAppErrorMessage,
} from '../../common';
import { GraphService } from '../../infrastructure/graph';
import { ObservabilityService } from '../../infrastructure/observability';
import { ProviderDiagnosticsService } from '../../infrastructure/observability/provider-diagnostics.service';
import { ChunkService } from '../chunk';
import { DocumentProcessingService } from '../document-processing';
import { DocumentRepository, type DocumentEntity, type DocumentType } from '../document';
import { EmbeddingService } from '../embedding';
import { KnowledgeGraphService } from '../knowledge-graph';
import type { SpaceMemberRole } from '../knowledge-space';
import { PipelineService, type PipelineJobEntity, type PipelineJobStatus } from '../pipeline';
import type { IngestDocumentDto } from './dto/ingest-document.dto';
import type { IngestSpaceDto } from './dto/ingest-space.dto';
import { IngestionRepository } from './ingestion.repository';
import type {
  GraphCountRecord,
  IngestionResult,
  IngestionJobResponse,
  IngestionStage,
  IngestionStageResult,
  IngestionStageStatus,
  IngestionStatus,
  IngestionStatusRecord,
  SpaceIngestionResult,
} from './ingestion.types';

interface NormalizedIngestionOptions {
  force: boolean;
  includeEmbedding: boolean;
  includeGraph: boolean;
}

const supportedDocumentTypes = new Set<DocumentType>([
  'PDF',
  'WORD',
  'TXT',
  'MARKDOWN',
  'IMAGE',
  'AUDIO',
  'VIDEO',
]);
const writeRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR'];

@Injectable()
export class IngestionService {
  constructor(
    private readonly chunkService: ChunkService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly documentRepository: DocumentRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly graphService: GraphService,
    private readonly ingestionRepository: IngestionRepository,
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly observabilityService: ObservabilityService,
    private readonly pipelineService: PipelineService,
    private readonly providerDiagnosticsService: ProviderDiagnosticsService,
  ) {}

  async ingestDocument(
    context: ExecutionContext,
    documentId: string,
    input: IngestDocumentDto = {},
  ): Promise<IngestionResult> {
    const options = this.normalizeOptions(input);
    this.observabilityService.ensureRequestId(context);
    this.observabilityService.ensureExecutionId(context);

    const activeDocument = await this.findWritableDocument(context, documentId);
    const pipelineJob = await this.pipelineService.startDocumentJob(context, activeDocument, {
      force: options.force,
      includeEmbedding: options.includeEmbedding,
      includeGraph: options.includeGraph,
    });

    return this.executeDocumentIngestion(context, activeDocument, options, pipelineJob);
  }

  async enqueueDocumentIngestion(
    context: ExecutionContext,
    documentId: string,
    input: IngestDocumentDto = {},
  ): Promise<IngestionJobResponse> {
    const options = this.normalizeOptions(input);
    this.observabilityService.ensureRequestId(context);
    this.observabilityService.ensureExecutionId(context);

    const activeDocument = await this.findWritableDocument(context, documentId);
    const queuedDocument = await this.documentRepository.update(activeDocument.id, {
      status: 'CREATED',
    });
    const pipelineJob = await this.pipelineService.startQueuedDocumentJob(context, queuedDocument, {
      force: options.force,
      includeEmbedding: options.includeEmbedding,
      includeGraph: options.includeGraph,
      ingestionAsync: true,
      ingestionOptions: options,
      executionContext: this.createExecutionContextSnapshot(context),
    });

    await this.pipelineService.recordStageEvent(pipelineJob, {
      durationMs: 0,
      metadata: {
        message: '已加入解析队列',
      },
      stage: 'queue',
      status: 'success',
    });

    return {
      documentId: queuedDocument.id,
      pipelineJobId: pipelineJob.id,
      spaceId: queuedDocument.spaceId,
      status: 'QUEUED',
    };
  }

  async runQueuedDocumentIngestion(pipelineJob: PipelineJobEntity): Promise<void> {
    const context = this.restoreExecutionContext(pipelineJob);
    const activeDocument = await this.findWritableDocument(context, pipelineJob.documentId);

    this.observabilityService.ensureRequestId(context);
    this.observabilityService.ensureExecutionId(context);

    if (pipelineJob.metadata.graphOnly === true) {
      await this.executeGraphRetry(context, activeDocument, pipelineJob);
      return;
    }

    await this.executeDocumentIngestion(
      context,
      activeDocument,
      this.readQueuedOptions(pipelineJob.metadata),
      pipelineJob,
    );
  }

  async enqueueGraphRetry(
    context: ExecutionContext,
    documentId: string,
  ): Promise<IngestionJobResponse> {
    this.observabilityService.ensureRequestId(context);
    this.observabilityService.ensureExecutionId(context);

    const document = await this.findWritableDocument(context, documentId);
    const status = await this.getStatusRecord(document.id);

    if (!status.hasContent || status.chunkCount === 0) {
      throw createAppBadRequestException(
        'INGESTION_FAILED',
        '文档尚未完成解析和切片，暂不能重试图谱抽取',
      );
    }

    await this.ensureGraphRetryReady();

    const pipelineJob = await this.pipelineService.startQueuedDocumentJob(context, document, {
      graphOnly: true,
      includeGraph: true,
      ingestionAsync: true,
      ingestionOptions: { force: false, includeEmbedding: false, includeGraph: true },
      executionContext: this.createExecutionContextSnapshot(context),
    });

    await this.pipelineService.recordStageEvent(pipelineJob, {
      durationMs: 0,
      metadata: { message: '已加入图谱抽取队列' },
      stage: 'queue',
      status: 'success',
    });

    return {
      documentId: document.id,
      pipelineJobId: pipelineJob.id,
      spaceId: document.spaceId,
      status: 'QUEUED',
    };
  }

  private async executeDocumentIngestion(
    context: ExecutionContext,
    activeDocument: DocumentEntity,
    options: NormalizedIngestionOptions,
    pipelineJob: PipelineJobEntity,
  ): Promise<IngestionResult> {
    const stages: IngestionStageResult[] = [];
    const startedAt = Date.now();
    let enteredProcessing = false;
    const document = activeDocument;

    try {
      const skipResult = await this.maybeSkipReadyDocument(
        context,
        activeDocument,
        options,
        stages,
        pipelineJob,
      );

      if (skipResult) {
        await this.pipelineService.finishJob(pipelineJob.id, 'SUCCEEDED');
        this.recordIngestion(context, activeDocument, stages, startedAt, 'success');
        return skipResult;
      }

      await this.runStage(context, activeDocument, stages, pipelineJob, 'validate', () => {
        this.validateDocument(activeDocument, options);
        return {
          documentStatus: activeDocument.status,
          documentType: activeDocument.type,
        };
      });

      await this.documentRepository.update(activeDocument.id, {
        status: 'PROCESSING',
      });
      enteredProcessing = true;

      await this.runStage(
        context,
        activeDocument,
        stages,
        pipelineJob,
        'document-processing',
        async () => {
          const content = await this.documentProcessingService.processDocument(activeDocument.id);

          return {
            cleaner: content.metadata.cleaner,
            contentHash: content.metadata.contentHash,
            documentContentId: content.id,
            language: content.metadata.language,
            ocr: content.metadata.ocr,
            sourceHash: content.metadata.sourceHash,
          };
        },
      );

      await this.runStage(context, activeDocument, stages, pipelineJob, 'chunking', async () => {
        const chunks = await this.chunkService.processChunks(activeDocument.id);

        return {
          chunkCount: chunks.length,
        };
      });

      if (options.includeEmbedding) {
        await this.runStage(context, activeDocument, stages, pipelineJob, 'embedding', async () => {
          const result = await this.embeddingService.processEmbedding(activeDocument.id);

          return {
            embeddingCount: result.embeddingCount,
            model: result.model,
          };
        });
      } else {
        await this.addSkippedStage(
          context,
          activeDocument,
          stages,
          pipelineJob,
          'embedding',
          'includeEmbedding=false',
        );
      }

      const graphCounts = options.includeGraph
        ? await this.runGraphExtractionStage(context, activeDocument, stages, pipelineJob)
        : await this.addSkippedStage(
            context,
            activeDocument,
            stages,
            pipelineJob,
            'graph-extraction',
            'includeGraph=false',
          );

      await this.documentRepository.update(activeDocument.id, {
        status: 'READY',
      });

      await this.runStage(context, activeDocument, stages, pipelineJob, 'done', async () => {
        const status = await this.getStatusRecord(activeDocument.id);

        this.ensureReadyStatus(status, options);

        return {
          embeddingCount: status.embeddingCount,
          hasContent: status.hasContent,
          chunkCount: status.chunkCount,
        };
      });

      await this.pipelineService.finishJob(pipelineJob.id, 'SUCCEEDED');
      this.recordIngestion(context, activeDocument, stages, startedAt, 'success');

      return this.createResult(
        await this.getStatusRecord(activeDocument.id),
        stages,
        options,
        this.toGraphCounts(graphCounts),
        pipelineJob.id,
      );
    } catch (error) {
      if (enteredProcessing) {
        await this.markDocumentFailed(document.id);
      }

      await this.finishPipelineJobSafely(pipelineJob, 'FAILED');

      this.recordIngestion(context, document, stages, startedAt, 'failed', error);
      throw error;
    }
  }

  private async executeGraphRetry(
    context: ExecutionContext,
    document: DocumentEntity,
    pipelineJob: PipelineJobEntity,
  ): Promise<void> {
    const stages: IngestionStageResult[] = [];
    const startedAt = Date.now();

    try {
      await this.runStage(context, document, stages, pipelineJob, 'validate', async () => {
        const status = await this.getStatusRecord(document.id);
        if (!status.hasContent || status.chunkCount === 0) {
          throw createAppBadRequestException(
            'INGESTION_FAILED',
            '文档尚未完成解析和切片，暂不能重试图谱抽取',
          );
        }
        await this.ensureGraphRetryReady();
        return { chunkCount: status.chunkCount, graphOnly: true };
      });

      await this.runGraphExtractionStage(context, document, stages, pipelineJob);
      await this.runStage(context, document, stages, pipelineJob, 'done', async () => {
        const graphCounts = await this.getGraphCounts(document.id);
        return {
          graphEntities: graphCounts?.graphEntities ?? 0,
          graphOnly: true,
          graphRelations: graphCounts?.graphRelations ?? 0,
        };
      });

      await this.pipelineService.finishJob(pipelineJob.id, 'SUCCEEDED');
      this.recordIngestion(context, document, stages, startedAt, 'success');
    } catch (error) {
      await this.finishPipelineJobSafely(pipelineJob, 'FAILED');
      this.recordIngestion(context, document, stages, startedAt, 'failed', error);
      throw error;
    }
  }

  private async ensureGraphRetryReady(): Promise<void> {
    const llm = await this.providerDiagnosticsService.checkLlm();

    if (llm.status !== 'ok') {
      throw createAppServiceUnavailableException(
        'LLM_UNAVAILABLE',
        llm.message || '大模型服务不可用，暂不能执行图谱抽取',
      );
    }

    try {
      await this.graphService.healthCheck();
    } catch {
      throw createAppServiceUnavailableException(
        'GRAPH_UNAVAILABLE',
        '图谱服务未连接，暂不能执行图谱抽取',
      );
    }
  }

  async getStatus(context: ExecutionContext, documentId: string): Promise<IngestionStatus> {
    const access = await this.ingestionRepository.findDocumentAccessById(
      documentId,
      context.userId,
      context.tenantId,
    );

    if (!access) {
      throw new NotFoundException('Document not found');
    }

    this.ensureReadableMember(access.memberRole);

    return this.createStatus(await this.getStatusRecord(documentId));
  }

  async ingestSpace(
    context: ExecutionContext,
    spaceId: string,
    input: IngestSpaceDto = {},
  ): Promise<SpaceIngestionResult> {
    const memberRole = await this.ingestionRepository.findSpaceMemberRole(
      spaceId,
      context.userId,
      context.tenantId,
    );

    this.ensureWriteRole(memberRole);

    const documentIds = input.documentIds?.length ? [...new Set(input.documentIds)] : undefined;
    const documents = await this.ingestionRepository.listActiveDocumentsBySpace(
      spaceId,
      context.tenantId,
      documentIds,
    );

    if (documentIds && documents.length !== documentIds.length) {
      throw new NotFoundException('One or more documents were not found in the knowledge space');
    }

    const results: IngestionResult[] = [];
    const failures: SpaceIngestionResult['failures'] = [];

    for (const document of documents) {
      try {
        results.push(await this.ingestDocument(context, document.id, input));
      } catch (error) {
        failures.push({
          documentId: document.id,
          errorMessage: this.toErrorMessage(error),
        });
      }
    }

    return {
      failed: failures.length,
      failures,
      results,
      spaceId,
      succeeded: results.length,
      total: documents.length,
    };
  }

  private async findWritableDocument(
    context: ExecutionContext,
    documentId: string,
  ): Promise<DocumentEntity> {
    const access = await this.ingestionRepository.findDocumentAccessById(
      documentId,
      context.userId,
      context.tenantId,
    );

    if (!access) {
      throw new NotFoundException('Document not found');
    }

    this.ensureWriteRole(access.memberRole);

    return access.document;
  }

  private createExecutionContextSnapshot(context: ExecutionContext): Record<string, unknown> {
    return {
      departmentId: context.departmentId,
      metadata: {
        executionId: this.readContextMetadataString(context, 'executionId'),
        requestId: this.readContextMetadataString(context, 'requestId'),
      },
      organizationId: context.organizationId,
      permissions: context.permissions,
      roles: context.roles,
      spaceIds: context.spaceIds,
      tenantId: context.tenantId,
      userId: context.userId,
    };
  }

  private restoreExecutionContext(pipelineJob: PipelineJobEntity): ExecutionContext {
    const snapshot = this.toRecord(pipelineJob.metadata.executionContext);
    const userId = this.readString(snapshot.userId) ?? pipelineJob.triggeredBy;

    if (!userId) {
      throw new BadRequestException('异步入库任务缺少执行用户上下文，请重新解析');
    }

    return {
      departmentId: this.readOptionalString(snapshot.departmentId),
      metadata: this.toRecord(snapshot.metadata),
      organizationId: this.readOptionalString(snapshot.organizationId),
      permissions: this.readStringArray(snapshot.permissions),
      roles: this.readStringArray(snapshot.roles),
      spaceIds: this.readStringArray(snapshot.spaceIds),
      tenantId: this.readOptionalString(snapshot.tenantId),
      userId,
    };
  }

  private readQueuedOptions(metadata: Record<string, unknown>): NormalizedIngestionOptions {
    const options = this.toRecord(metadata.ingestionOptions);

    return {
      force: options.force === true,
      includeEmbedding: options.includeEmbedding !== false,
      includeGraph: options.includeGraph !== false,
    };
  }

  private normalizeOptions(input: IngestDocumentDto | IngestSpaceDto): NormalizedIngestionOptions {
    return {
      force: input.force ?? false,
      includeEmbedding: input.includeEmbedding ?? true,
      includeGraph: input.includeGraph ?? true,
    };
  }

  private toRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private readOptionalString(value: unknown): string | undefined {
    return this.readString(value) ?? undefined;
  }

  private readStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private readContextMetadataString(context: ExecutionContext, key: string): string | undefined {
    return this.readOptionalString(context.metadata[key]);
  }

  private async maybeSkipReadyDocument(
    context: ExecutionContext,
    document: DocumentEntity,
    options: NormalizedIngestionOptions,
    stages: IngestionStageResult[],
    pipelineJob: PipelineJobEntity,
  ): Promise<IngestionResult | null> {
    if (document.status !== 'READY' || options.force) {
      return null;
    }

    await this.addSkippedStage(context, document, stages, pipelineJob, 'validate', 'already-ready');

    return this.createResult(
      await this.getStatusRecord(document.id),
      stages,
      options,
      undefined,
      pipelineJob.id,
    );
  }

  private validateDocument(document: DocumentEntity, options: NormalizedIngestionOptions): void {
    if (document.status === 'READY' && !options.force) {
      throw new BadRequestException('Document is already ready; use force=true to re-ingest');
    }

    if (document.status === 'FAILED' && !options.force) {
      throw new BadRequestException('Document is failed; use force=true to re-ingest');
    }

    if (!document.storageKey) {
      throw new BadRequestException('Document storage key is required for ingestion');
    }

    if (!supportedDocumentTypes.has(document.type)) {
      throw createAppBadRequestException('UNSUPPORTED_FILE_TYPE');
    }
  }

  private async runStage<TMetadata extends Record<string, unknown> | void>(
    context: ExecutionContext,
    document: DocumentEntity,
    stages: IngestionStageResult[],
    pipelineJob: PipelineJobEntity,
    stage: IngestionStage,
    action: () => Promise<TMetadata> | TMetadata,
  ): Promise<TMetadata> {
    const startedAt = Date.now();

    try {
      const metadata = await action();
      const result = this.createStageResult(stage, 'success', startedAt, metadata);

      stages.push(result);
      this.recordStage(context, document, result);
      await this.recordPipelineStage(pipelineJob, result);

      return metadata;
    } catch (error) {
      const result = this.createStageResult(stage, 'failed', startedAt, undefined, error);

      stages.push(result);
      this.recordStage(context, document, result, error);
      await this.recordPipelineStage(pipelineJob, result);
      throw error;
    }
  }

  private async addSkippedStage(
    context: ExecutionContext,
    document: DocumentEntity,
    stages: IngestionStageResult[],
    pipelineJob: PipelineJobEntity,
    stage: IngestionStage,
    reason: string,
  ): Promise<Record<string, unknown>> {
    const result: IngestionStageResult = {
      durationMs: 0,
      metadata: {
        reason,
      },
      stage,
      status: 'skipped',
    };

    stages.push(result);
    this.recordStage(context, document, result);
    await this.recordPipelineStage(pipelineJob, result);

    return result.metadata ?? {};
  }

  private async runGraphExtractionStage(
    context: ExecutionContext,
    document: DocumentEntity,
    stages: IngestionStageResult[],
    pipelineJob: PipelineJobEntity,
  ): Promise<Record<string, unknown>> {
    const startedAt = Date.now();

    try {
      const result = await this.knowledgeGraphService.extractDocumentGraph(document.id);
      const metadata = {
        entityTypeDistribution: result.entityTypeDistribution,
        graphEntities: result.entityCount,
        graphExtractionStatus: 'success',
        graphRelations: result.relationCount,
        sourceChunkCount: result.chunkCount,
      };
      const stageResult = this.createStageResult(
        'graph-extraction',
        'success',
        startedAt,
        metadata,
      );

      stages.push(stageResult);
      this.recordStage(context, document, stageResult);
      await this.recordPipelineStage(pipelineJob, stageResult);

      return metadata;
    } catch (error) {
      const errorMessage = this.toSafeErrorMessage(error, 'Graph extraction failed');
      const metadata = {
        graphEntities: 0,
        graphExtractionStatus: 'failed',
        graphRelations: 0,
        reason: 'graph-extraction-failed',
      };
      const stageResult: IngestionStageResult = {
        durationMs: Date.now() - startedAt,
        errorMessage,
        metadata,
        stage: 'graph-extraction',
        status: 'failed',
      };

      stages.push(stageResult);
      this.recordStage(context, document, stageResult, error);
      await this.recordPipelineStage(pipelineJob, stageResult);

      return metadata;
    }
  }

  private createStageResult(
    stage: IngestionStage,
    status: IngestionStageStatus,
    startedAt: number,
    metadata?: Record<string, unknown> | void,
    error?: unknown,
  ): IngestionStageResult {
    return {
      durationMs: Date.now() - startedAt,
      errorMessage: error ? this.toErrorMessage(error) : undefined,
      metadata: metadata || undefined,
      stage,
      status,
    };
  }

  private ensureWriteRole(memberRole: SpaceMemberRole | null): void {
    if (!memberRole) {
      throw new NotFoundException('Knowledge space not found');
    }

    if (!writeRoles.includes(memberRole)) {
      throw new ForbiddenException('Insufficient knowledge space role');
    }
  }

  private ensureReadableMember(memberRole: SpaceMemberRole | null): void {
    if (!memberRole) {
      throw new NotFoundException('Knowledge space not found');
    }
  }

  private async getStatusRecord(documentId: string): Promise<IngestionStatusRecord> {
    const status = await this.ingestionRepository.getStatusByDocumentId(documentId);

    if (!status) {
      throw new NotFoundException('Document not found');
    }

    return status;
  }

  private async createStatus(status: IngestionStatusRecord): Promise<IngestionStatus> {
    const graphCounts = await this.getGraphCounts(status.document.id);

    return {
      chunkCount: status.chunkCount,
      documentId: status.document.id,
      documentStatus: status.document.status,
      embeddingCount: status.embeddingCount,
      graphEntityCount: graphCounts?.graphEntities,
      graphRelationCount: graphCounts?.graphRelations,
      hasContent: status.hasContent,
      readyForRetrieval: this.isReadyForRetrieval(status, {
        includeEmbedding: true,
      }),
      spaceId: status.document.spaceId,
    };
  }

  private createResult(
    status: IngestionStatusRecord,
    stages: IngestionStageResult[],
    options: NormalizedIngestionOptions,
    graphCounts?: GraphCountRecord,
    pipelineJobId?: string,
  ): IngestionResult {
    return {
      counts: {
        chunks: status.chunkCount,
        embeddings: status.embeddingCount,
        graphEntities: graphCounts?.graphEntities,
        graphRelations: graphCounts?.graphRelations,
      },
      documentId: status.document.id,
      pipelineJobId,
      readyForRetrieval: this.isReadyForRetrieval(status, options),
      spaceId: status.document.spaceId,
      stages,
      status: status.document.status === 'FAILED' ? 'FAILED' : 'READY',
    };
  }

  private ensureReadyStatus(
    status: IngestionStatusRecord,
    options: NormalizedIngestionOptions,
  ): void {
    if (!status.hasContent || status.chunkCount === 0) {
      throw new BadRequestException('Document ingestion did not produce content chunks');
    }

    if (options.includeEmbedding && status.embeddingCount !== status.chunkCount) {
      throw new BadRequestException('Document ingestion did not produce embeddings for all chunks');
    }
  }

  private isReadyForRetrieval(
    status: IngestionStatusRecord,
    options: Pick<NormalizedIngestionOptions, 'includeEmbedding'>,
  ): boolean {
    return (
      status.document.status === 'READY' &&
      status.hasContent &&
      status.chunkCount > 0 &&
      (!options.includeEmbedding || status.embeddingCount === status.chunkCount)
    );
  }

  private async getGraphCounts(documentId: string): Promise<GraphCountRecord | undefined> {
    try {
      const counts = await this.knowledgeGraphService.getDocumentGraphCounts(documentId);

      return {
        graphEntities: counts.entityCount,
        graphRelations: counts.relationCount,
      };
    } catch {
      return undefined;
    }
  }

  private toGraphCounts(
    metadata: Record<string, unknown> | undefined,
  ): GraphCountRecord | undefined {
    if (!metadata || !('graphEntities' in metadata) || !('graphRelations' in metadata)) {
      return undefined;
    }

    return {
      graphEntities: Number(metadata.graphEntities),
      graphRelations: Number(metadata.graphRelations),
    };
  }

  private recordStage(
    context: ExecutionContext,
    document: DocumentEntity,
    stage: IngestionStageResult,
    error?: unknown,
  ): void {
    this.observabilityService.recordIngestionStage({
      context,
      documentId: document.id,
      durationMs: stage.durationMs,
      error,
      spaceId: document.spaceId,
      stage: stage.stage,
      status: stage.status,
    });
  }

  private async recordPipelineStage(
    pipelineJob: PipelineJobEntity,
    stage: IngestionStageResult,
  ): Promise<void> {
    await this.pipelineService.recordStageEvent(pipelineJob, {
      durationMs: stage.durationMs,
      errorMessage: stage.errorMessage,
      metadata: stage.metadata,
      stage: stage.stage,
      status: stage.status,
    });
  }

  private recordIngestion(
    context: ExecutionContext,
    document: DocumentEntity | null,
    stages: IngestionStageResult[],
    startedAt: number,
    status: 'success' | 'failed',
    error?: unknown,
  ): void {
    this.observabilityService.recordIngestion({
      context,
      documentId: document?.id,
      durationMs: Date.now() - startedAt,
      error,
      spaceId: document?.spaceId,
      stageCount: stages.length,
      status,
    });
  }

  private async markDocumentFailed(documentId: string): Promise<void> {
    try {
      await this.documentRepository.update(documentId, {
        status: 'FAILED',
      });
    } catch {
      return;
    }
  }

  private async finishPipelineJobSafely(
    pipelineJob: PipelineJobEntity,
    status: PipelineJobStatus,
  ): Promise<void> {
    try {
      await this.pipelineService.finishJob(pipelineJob.id, status);
    } catch {
      return;
    }
  }

  private toErrorMessage(error: unknown): string {
    return toAppErrorMessage(error, 'Document ingestion failed');
  }

  private toSafeErrorMessage(error: unknown, fallback: string): string {
    return toAppErrorMessage(error, fallback)
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
      .replace(/(api[-_]?key|authorization|secret|password)\s*[:=]\s*[^,\s}]+/gi, '$1=[redacted]')
      .replace(/\s+/g, ' ')
      .slice(0, 240)
      .trim();
  }
}
