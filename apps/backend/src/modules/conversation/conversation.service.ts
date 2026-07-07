import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ConversationRepository } from './conversation.repository';
import type { CreateMessageInput } from './conversation.types';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { ConversationEntity } from './entities/conversation.entity';
import type { MessageEntity } from './entities/message.entity';

const defaultConversationTitle = 'New Conversation';

@Injectable()
export class ConversationService {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  create(context: ExecutionContext, input: CreateConversationDto): Promise<ConversationEntity> {
    return this.conversationRepository.createConversation({
      title: input.title?.trim() || defaultConversationTitle,
      userId: context.userId,
    });
  }

  list(context: ExecutionContext): Promise<ConversationEntity[]> {
    return this.conversationRepository.findUserConversations(context.userId);
  }

  async getById(context: ExecutionContext, id: string): Promise<ConversationEntity> {
    return this.findOwnedConversation(context, id);
  }

  async delete(context: ExecutionContext, id: string): Promise<ConversationEntity> {
    await this.findOwnedConversation(context, id);

    return this.conversationRepository.deleteConversation(id);
  }

  async createMessage(
    context: ExecutionContext,
    conversationId: string,
    input: CreateMessageInput,
  ): Promise<MessageEntity> {
    await this.findOwnedConversation(context, conversationId);

    return this.conversationRepository.createMessage({
      conversationId,
      role: input.role,
      content: input.content,
      metadata: input.metadata,
    });
  }

  async listMessages(context: ExecutionContext, conversationId: string): Promise<MessageEntity[]> {
    await this.findOwnedConversation(context, conversationId);

    return this.conversationRepository.listMessages(conversationId);
  }

  async findOwnedConversation(
    context: ExecutionContext,
    conversationId: string,
  ): Promise<ConversationEntity> {
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== context.userId) {
      throw new ForbiddenException('Conversation does not belong to current user');
    }

    return conversation;
  }
}
