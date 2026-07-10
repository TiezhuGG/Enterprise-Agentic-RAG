import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { KnowledgeGraphService } from './knowledge-graph.service';
import type { GraphView } from './knowledge-graph.types';

@Controller()
@UseGuards(JwtAuthGuard)
export class KnowledgeGraphController {
  constructor(
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Get('documents/:id/graph')
  getDocumentGraph(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<GraphView> {
    return this.knowledgeGraphService.getDocumentGraph(this.createExecutionContext(user), id);
  }

  @Get('spaces/:spaceId/graph')
  getSpaceGraph(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ): Promise<GraphView> {
    return this.knowledgeGraphService.getSpaceGraph(this.createExecutionContext(user), spaceId, {
      limit: limit ? Number(limit) : undefined,
      query,
    });
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
