import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { AddSpaceMemberDto } from './dto/add-space-member.dto';
import { AddSpaceMembersDto } from './dto/add-space-members.dto';
import { CreateKnowledgeSpaceDto } from './dto/create-knowledge-space.dto';
import { UpdateSpaceMemberDto } from './dto/update-space-member.dto';
import { UpdateKnowledgeSpaceDto } from './dto/update-knowledge-space.dto';
import type {
  KnowledgeSpaceEntity,
  SpaceMemberDetailEntity,
} from './entities/knowledge-space.entity';
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

  @Get(':id/members')
  listMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SpaceMemberDetailEntity[]> {
    return this.knowledgeSpaceService.listMembers(this.createExecutionContext(user), id);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() addSpaceMemberDto: AddSpaceMemberDto,
  ): Promise<SpaceMemberDetailEntity[]> {
    return this.knowledgeSpaceService.addMember(
      this.createExecutionContext(user),
      id,
      addSpaceMemberDto,
    );
  }

  @Get(':id/member-candidates')
  listMemberCandidates(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') spaceId: string,
    @Query('q') search?: string,
  ) {
    return this.knowledgeSpaceService.listMemberCandidates(
      this.createExecutionContext(user),
      spaceId,
      search,
    );
  }

  @Post(':id/members/batch')
  addMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') spaceId: string,
    @Body() input: AddSpaceMembersDto,
  ): Promise<SpaceMemberDetailEntity[]> {
    return this.knowledgeSpaceService.addMembers(this.createExecutionContext(user), spaceId, input);
  }

  @Patch(':id/members/:userId')
  updateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateSpaceMemberDto: UpdateSpaceMemberDto,
  ): Promise<SpaceMemberDetailEntity[]> {
    return this.knowledgeSpaceService.updateMember(
      this.createExecutionContext(user),
      id,
      userId,
      updateSpaceMemberDto,
    );
  }

  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<SpaceMemberDetailEntity[]> {
    return this.knowledgeSpaceService.removeMember(this.createExecutionContext(user), id, userId);
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
