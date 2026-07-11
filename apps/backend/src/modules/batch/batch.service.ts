import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { toAppErrorMessage } from '../../common';
import { DocumentService, type DocumentEntity } from '../document';
import { IngestionService, type IngestionResult } from '../ingestion';
import { TaxonomyService, type DocumentTaxonomyEntity } from '../taxonomy';
import type { BatchDocumentIdsDto } from './dto/batch-document-ids.dto';
import type { BatchIngestDto } from './dto/batch-ingest.dto';
import type { BatchTaxonomyDto } from './dto/batch-taxonomy.dto';
import type { BatchOperation, BatchOperationItem, BatchOperationResponse } from './batch.types';

@Injectable()
export class BatchService {
  constructor(
    private readonly documentService: DocumentService,
    private readonly ingestionService: IngestionService,
    private readonly taxonomyService: TaxonomyService,
  ) {}

  archiveDocuments(
    context: ExecutionContext,
    input: BatchDocumentIdsDto,
  ): Promise<BatchOperationResponse<DocumentEntity>> {
    return this.runBatch('archive', input.documentIds, async (documentId) =>
      this.documentService.delete(context, documentId),
    );
  }

  ingestDocuments(
    context: ExecutionContext,
    input: BatchIngestDto,
  ): Promise<BatchOperationResponse<IngestionResult>> {
    return this.runBatch('ingest', input.documentIds, async (documentId) =>
      this.ingestionService.ingestDocument(context, documentId, {
        force: input.force,
        includeEmbedding: input.includeEmbedding,
        includeGraph: input.includeGraph,
      }),
    );
  }

  updateTaxonomy(
    context: ExecutionContext,
    input: BatchTaxonomyDto,
  ): Promise<BatchOperationResponse<DocumentTaxonomyEntity>> {
    return this.runBatch('taxonomy', input.documentIds, async (documentId) =>
      this.taxonomyService.updateDocumentTaxonomy(context, documentId, {
        categoryId: input.categoryId,
        tagIds: input.tagIds,
      }),
    );
  }

  private async runBatch<TData>(
    operation: BatchOperation,
    documentIds: string[],
    action: (documentId: string) => Promise<TData>,
  ): Promise<BatchOperationResponse<TData>> {
    const uniqueDocumentIds = [...new Set(documentIds.filter(Boolean))];
    const results: Array<BatchOperationItem<TData>> = [];

    for (const documentId of uniqueDocumentIds) {
      try {
        results.push({
          data: await action(documentId),
          documentId,
          status: 'success',
        });
      } catch (error) {
        results.push({
          documentId,
          errorMessage: toAppErrorMessage(error, `${operation} failed`),
          status: 'failed',
        });
      }
    }

    const succeeded = results.filter((result) => result.status === 'success').length;

    return {
      failed: results.length - succeeded,
      operation,
      results,
      succeeded,
      total: results.length,
    };
  }
}
