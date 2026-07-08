import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { ListExecutionsDto } from './dto/list-executions.dto';
import { ExecutionService } from './execution.service';
import type {
  ExecutionRunDetail,
  ExecutionRunEntity,
  ExecutionTraceEventEntity,
} from './execution.types';

@Controller('executions')
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListExecutionsDto,
  ): Promise<ExecutionRunEntity[]> {
    return this.executionService.listRuns(this.createExecutionContext(user), {
      limit: query.limit,
    });
  }

  @Get(':executionId/timeline')
  getTimeline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('executionId') executionId: string,
  ): Promise<ExecutionTraceEventEntity[]> {
    return this.executionService.getTimeline(this.createExecutionContext(user), executionId);
  }

  @Get(':executionId')
  getRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('executionId') executionId: string,
  ): Promise<ExecutionRunDetail> {
    return this.executionService.getRun(this.createExecutionContext(user), executionId);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
