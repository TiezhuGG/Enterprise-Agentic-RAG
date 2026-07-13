import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import type { DocumentEntity } from '../document';
import type { IngestionJobResponse } from '../ingestion';
import type { DocumentTaxonomyEntity } from '../taxonomy';
import { BatchService } from './batch.service';
import type { BatchOperationResponse } from './batch.types';
import { BatchDocumentIdsDto } from './dto/batch-document-ids.dto';
import { BatchIngestDto } from './dto/batch-ingest.dto';
import { BatchTaxonomyDto } from './dto/batch-taxonomy.dto';

@Controller('documents/batch')
@UseGuards(JwtAuthGuard)
export class BatchController {
  constructor(
    private readonly batchService: BatchService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('archive')
  archiveDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: BatchDocumentIdsDto,
  ): Promise<BatchOperationResponse<DocumentEntity>> {
    return this.batchService.archiveDocuments(this.createExecutionContext(user), input);
  }

  @Post('ingest')
  ingestDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: BatchIngestDto,
  ): Promise<BatchOperationResponse<IngestionJobResponse>> {
    return this.batchService.ingestDocuments(this.createExecutionContext(user), input);
  }

  @Patch('taxonomy')
  updateTaxonomy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: BatchTaxonomyDto,
  ): Promise<BatchOperationResponse<DocumentTaxonomyEntity>> {
    return this.batchService.updateTaxonomy(this.createExecutionContext(user), input);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
