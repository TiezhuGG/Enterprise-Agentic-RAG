import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { PipelineService } from './pipeline.service';
import type { PipelineEventEntity, PipelineJobDetail, PipelineJobEntity } from './pipeline.types';

@Controller()
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(
    private readonly pipelineService: PipelineService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Get('documents/:documentId/pipeline/jobs')
  listDocumentJobs(
    @CurrentUser() user: AuthenticatedUser,
    @Param('documentId') documentId: string,
    @Query('limit') limit?: string,
  ): Promise<PipelineJobEntity[]> {
    return this.pipelineService.listDocumentJobs(
      this.createExecutionContext(user),
      documentId,
      limit,
    );
  }

  @Get('pipeline/jobs/:jobId')
  getJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<PipelineJobDetail> {
    return this.pipelineService.getJob(this.createExecutionContext(user), jobId);
  }

  @Get('pipeline/jobs/:jobId/events')
  listJobEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<PipelineEventEntity[]> {
    return this.pipelineService.listJobEvents(this.createExecutionContext(user), jobId);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
