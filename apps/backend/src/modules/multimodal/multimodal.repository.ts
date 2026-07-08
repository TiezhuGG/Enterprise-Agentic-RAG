import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type {
  MultimodalAttachmentEntity,
  MultimodalAttachmentStatus,
  MultimodalAttachmentType,
} from './multimodal.types';

export interface CreateMultimodalAttachmentInput {
  userId: string;
  conversationId?: string;
  type: MultimodalAttachmentType;
  status?: MultimodalAttachmentStatus;
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  extractedText?: string;
}

export interface UpdateMultimodalAttachmentInput {
  status?: MultimodalAttachmentStatus;
  extractedText?: string;
}

type MultimodalAttachmentModel = MultimodalAttachmentEntity;

const toAttachmentEntity = (attachment: MultimodalAttachmentModel): MultimodalAttachmentEntity => ({
  id: attachment.id,
  userId: attachment.userId,
  conversationId: attachment.conversationId,
  type: attachment.type,
  status: attachment.status,
  filename: attachment.filename,
  mimeType: attachment.mimeType,
  size: attachment.size,
  storageKey: attachment.storageKey,
  extractedText: attachment.extractedText,
  createdAt: attachment.createdAt,
  updatedAt: attachment.updatedAt,
});

@Injectable()
export class MultimodalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateMultimodalAttachmentInput): Promise<MultimodalAttachmentEntity> {
    const attachment = await this.prisma.multimodalAttachment.create({
      data: {
        userId: input.userId,
        conversationId: input.conversationId,
        type: input.type,
        status: input.status ?? 'CREATED',
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size,
        storageKey: input.storageKey,
        extractedText: input.extractedText ?? '',
      },
    });

    return toAttachmentEntity(attachment);
  }

  async update(
    id: string,
    input: UpdateMultimodalAttachmentInput,
  ): Promise<MultimodalAttachmentEntity> {
    const attachment = await this.prisma.multimodalAttachment.update({
      where: {
        id,
      },
      data: input,
    });

    return toAttachmentEntity(attachment);
  }

  async findManyByIdsForUser(ids: string[], userId: string): Promise<MultimodalAttachmentEntity[]> {
    const attachments = await this.prisma.multimodalAttachment.findMany({
      where: {
        id: {
          in: ids,
        },
        userId,
      },
    });

    return attachments.map(toAttachmentEntity);
  }
}
