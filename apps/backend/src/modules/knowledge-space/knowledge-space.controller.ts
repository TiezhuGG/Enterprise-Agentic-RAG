import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { CreateKnowledgeSpaceDto } from './dto/create-knowledge-space.dto';
import { UpdateKnowledgeSpaceDto } from './dto/update-knowledge-space.dto';
import type { KnowledgeSpaceEntity } from './entities/knowledge-space.entity';
import { KnowledgeSpaceService } from './knowledge-space.service';

@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class KnowledgeSpaceController {
  constructor(
    private readonly knowledgeSpaceService: KnowledgeSpaceService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createKnowledgeSpaceDto: CreateKnowledgeSpaceDto,
  ): Promise<KnowledgeSpaceEntity> {
    return this.knowledgeSpaceService.create(
      this.createExecutionContext(user),
      createKnowledgeSpaceDto,
    );
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<KnowledgeSpaceEntity[]> {
    return this.knowledgeSpaceService.list(this.createExecutionContext(user));
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<KnowledgeSpaceEntity> {
    return this.knowledgeSpaceService.getById(this.createExecutionContext(user), id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateKnowledgeSpaceDto: UpdateKnowledgeSpaceDto,
  ): Promise<KnowledgeSpaceEntity> {
    return this.knowledgeSpaceService.update(
      this.createExecutionContext(user),
      id,
      updateKnowledgeSpaceDto,
    );
  }

  @Delete(':id')
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<KnowledgeSpaceEntity> {
    return this.knowledgeSpaceService.delete(this.createExecutionContext(user), id);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
