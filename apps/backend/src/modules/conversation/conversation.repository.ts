import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import type { ConversationEntity, ConversationStatus } from './entities/conversation.entity';
import type { MessageEntity, MessageRole } from './entities/message.entity';

export interface CreateConversationInput {
  title: string;
  userId: string;
}

export interface CreateMessageRecordInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

type ConversationModel = ConversationEntity;

type MessageModel = Omit<MessageEntity, 'metadata'> & {
  metadata: unknown;
};

const activeConversationWhere = {
  status: 'ACTIVE' as ConversationStatus,
};

const toMetadataObject = (metadata: unknown): Record<string, unknown> => {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return {};
};

const toInputJson = (metadata: Record<string, unknown> | undefined): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(metadata ?? {})) as Prisma.InputJsonValue;

const toConversationEntity = (conversation: ConversationModel): ConversationEntity => ({
  id: conversation.id,
  title: conversation.title,
  status: conversation.status,
  userId: conversation.userId,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
});

const toMessageEntity = (message: MessageModel): MessageEntity => ({
  id: message.id,
  conversationId: message.conversationId,
  role: message.role,
  content: message.content,
  metadata: toMetadataObject(message.metadata),
  createdAt: message.createdAt,
});

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(input: CreateConversationInput): Promise<ConversationEntity> {
    const conversation = await this.prisma.conversation.create({
      data: {
        title: input.title,
        userId: input.userId,
      },
    });

    return toConversationEntity(conversation);
  }

  async findUserConversations(userId: string): Promise<ConversationEntity[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        ...activeConversationWhere,
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations.map(toConversationEntity);
  }

  async findById(id: string): Promise<ConversationEntity | null> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        ...activeConversationWhere,
        id,
      },
    });

    return conversation ? toConversationEntity(conversation) : null;
  }

  async deleteConversation(id: string): Promise<ConversationEntity> {
    const conversation = await this.prisma.conversation.update({
      where: {
        id,
      },
      data: {
        status: 'DELETED',
      },
    });

    return toConversationEntity(conversation);
  }

  async createMessage(input: CreateMessageRecordInput): Promise<MessageEntity> {
    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        metadata: toInputJson(input.metadata),
      },
    });

    return toMessageEntity(message);
  }

  async listMessages(conversationId: string): Promise<MessageEntity[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages.map(toMessageEntity);
  }
}
