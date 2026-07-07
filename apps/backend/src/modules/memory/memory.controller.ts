import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { MemoryService } from './memory.service';
import type { MemoryListResponse } from './memory.types';

@Controller('memory')
@UseGuards(JwtAuthGuard)
export class MemoryController {
  constructor(
    private readonly memoryService: MemoryService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('query') query?: string,
  ): Promise<MemoryListResponse> {
    return this.memoryService.listMemory(this.createExecutionContext(user), query);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.memoryService.deleteMemory(this.createExecutionContext(user), id);

    return { deleted: true };
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
