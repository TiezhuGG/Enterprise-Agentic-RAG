import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { IngestDocumentDto } from './dto/ingest-document.dto';
import { IngestSpaceDto } from './dto/ingest-space.dto';
import { IngestionService } from './ingestion.service';
import type { IngestionResult, IngestionStatus, SpaceIngestionResult } from './ingestion.types';

@Controller()
@UseGuards(JwtAuthGuard)
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('documents/:id/ingest')
  ingestDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: IngestDocumentDto,
  ): Promise<IngestionResult> {
    return this.ingestionService.ingestDocument(this.createExecutionContext(user), id, input);
  }

  @Get('documents/:id/ingest/status')
  getDocumentStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IngestionStatus> {
    return this.ingestionService.getStatus(this.createExecutionContext(user), id);
  }

  @Post('spaces/:spaceId/ingest')
  ingestSpace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
    @Body() input: IngestSpaceDto,
  ): Promise<SpaceIngestionResult> {
    return this.ingestionService.ingestSpace(this.createExecutionContext(user), spaceId, input);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
