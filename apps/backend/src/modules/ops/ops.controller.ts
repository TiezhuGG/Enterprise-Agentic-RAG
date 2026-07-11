import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { OpsSummaryQueryDto } from './dto/ops-summary-query.dto';
import { OpsService } from './ops.service';
import type { OpsSummary } from './ops.types';

@Controller('ops')
@UseGuards(JwtAuthGuard)
export class OpsController {
  constructor(
    private readonly opsService: OpsService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OpsSummaryQueryDto,
  ): Promise<OpsSummary> {
    return this.opsService.getSummary(this.createExecutionContext(user), {
      limit: query.limit,
    });
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
