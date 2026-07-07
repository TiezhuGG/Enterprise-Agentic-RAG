import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import type { ConversationEntity } from './entities/conversation.entity';
import type { MessageEntity } from './entities/message.entity';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ConversationEntity> {
    return this.conversationService.create(
      this.createExecutionContext(user),
      createConversationDto,
    );
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<ConversationEntity[]> {
    return this.conversationService.list(this.createExecutionContext(user));
  }

  @Get(':id/messages')
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<MessageEntity[]> {
    return this.conversationService.listMessages(this.createExecutionContext(user), id);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ConversationEntity> {
    return this.conversationService.getById(this.createExecutionContext(user), id);
  }

  @Delete(':id')
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ConversationEntity> {
    return this.conversationService.delete(this.createExecutionContext(user), id);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
