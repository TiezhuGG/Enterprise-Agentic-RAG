import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import type {
  MultimodalAttachmentEntity,
  MultimodalExtractionMetadata,
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
  metadata?: MultimodalExtractionMetadata;
}

export interface UpdateMultimodalAttachmentInput {
  status?: MultimodalAttachmentStatus;
  extractedText?: string;
  metadata?: MultimodalExtractionMetadata;
}

type MultimodalAttachmentModel = Omit<MultimodalAttachmentEntity, 'metadata'> & {
  metadata: unknown;
};

const defaultMetadata = (): MultimodalExtractionMetadata => ({
  modality: 'image',
  processedAt: new Date(0).toISOString(),
  provider: 'unknown',
});

const normalizeMetadata = (metadata: unknown): MultimodalExtractionMetadata => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return defaultMetadata();
  }

  const candidate = metadata as Record<string, unknown>;

  return {
    ...candidate,
    modality:
      candidate.modality === 'audio' || candidate.modality === 'video'
        ? candidate.modality
        : 'image',
    processedAt:
      typeof candidate.processedAt === 'string' ? candidate.processedAt : new Date(0).toISOString(),
    provider: typeof candidate.provider === 'string' ? candidate.provider : 'unknown',
  };
};

const toPrismaMetadata = (metadata: MultimodalExtractionMetadata): Prisma.InputJsonObject =>
  ({ ...metadata }) as Prisma.InputJsonObject;

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
  metadata: normalizeMetadata(attachment.metadata),
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
        metadata: input.metadata ? toPrismaMetadata(input.metadata) : {},
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
      data: {
        status: input.status,
        extractedText: input.extractedText,
        ...(input.metadata ? { metadata: toPrismaMetadata(input.metadata) } : {}),
      },
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
