import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { createAppBadRequestException, toAppErrorMessage } from '../../common';
import { ObservabilityService } from '../../infrastructure/observability';
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
    private readonly ingestionRepository: IngestionRepository,
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly observabilityService: ObservabilityService,
    private readonly pipelineService: PipelineService,
  ) {}

  async ingestDocument(
    context: ExecutionContext,
    documentId: string,
    input: IngestDocumentDto = {},
  ): Promise<IngestionResult> {
    const options = this.normalizeOptions(input);
    const stages: IngestionStageResult[] = [];
    const startedAt = Date.now();
    let document: DocumentEntity | null = null;
    let enteredProcessing = false;
    let pipelineJob: PipelineJobEntity | null = null;

    this.observabilityService.ensureRequestId(context);
    this.observabilityService.ensureExecutionId(context);

    try {
      const access = await this.ingestionRepository.findDocumentAccessById(
        documentId,
        context.userId,
        context.tenantId,
      );

      if (!access) {
        throw new NotFoundException('Document not found');
      }

      document = access.document;
      const activeDocument = document;
      this.ensureWriteRole(access.memberRole);
      pipelineJob = await this.pipelineService.startDocumentJob(context, activeDocument, {
        force: options.force,
        includeEmbedding: options.includeEmbedding,
        includeGraph: options.includeGraph,
      });

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
        ? await this.runStage(
            context,
            activeDocument,
            stages,
            pipelineJob,
            'graph-extraction',
            async () => {
              const result = await this.knowledgeGraphService.extractDocumentGraph(
                activeDocument.id,
              );

              return {
                graphEntities: result.entityCount,
                graphRelations: result.relationCount,
              };
            },
          )
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
      if (document && enteredProcessing) {
        await this.markDocumentFailed(document.id);
      }

      if (pipelineJob) {
        await this.finishPipelineJobSafely(pipelineJob, 'FAILED');
      }

      this.recordIngestion(context, document, stages, startedAt, 'failed', error);
      throw error;
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

  private normalizeOptions(input: IngestDocumentDto | IngestSpaceDto): NormalizedIngestionOptions {
    return {
      force: input.force ?? false,
      includeEmbedding: input.includeEmbedding ?? true,
      includeGraph: input.includeGraph ?? true,
    };
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
}
