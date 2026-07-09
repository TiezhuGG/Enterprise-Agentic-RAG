import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { basename } from 'node:path';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import { StorageService } from '../../infrastructure/storage';
import { ConversationService } from '../conversation';
import type { UploadMultimodalAttachmentDto } from './dto/upload-multimodal-attachment.dto';
import { MultimodalRepository } from './multimodal.repository';
import type {
  MultimodalAttachmentEntity,
  MultimodalAttachmentResponse,
  MultimodalAttachmentType,
  MultimodalContext,
  UploadedMultimodalFile,
} from './multimodal.types';
import { MULTIMODAL_PROVIDER, type MultimodalProvider } from './providers/multimodal.provider';

@Injectable()
export class MultimodalService {
  constructor(
    private readonly configService: ConfigService,
    private readonly conversationService: ConversationService,
    private readonly multimodalRepository: MultimodalRepository,
    @Inject(MULTIMODAL_PROVIDER)
    private readonly multimodalProvider: MultimodalProvider,
    private readonly storageService: StorageService,
  ) {}

  async uploadAttachment(
    context: ExecutionContext,
    input: UploadMultimodalAttachmentDto,
    file: UploadedMultimodalFile | undefined,
  ): Promise<MultimodalAttachmentResponse> {
    const uploadFile = this.validateFile(file);
    const conversationId = input.conversationId?.trim() || undefined;

    if (conversationId) {
      await this.conversationService.findOwnedConversation(context, conversationId);
    }

    const type = this.resolveAttachmentType(uploadFile);
    const storageKey = this.createObjectKey(context.userId, uploadFile.originalname);

    try {
      await this.storageService.uploadObject(storageKey, uploadFile.buffer, uploadFile.mimetype);
    } catch {
      throw new InternalServerErrorException('Multimodal attachment upload failed');
    }

    const attachment = await this.multimodalRepository.create({
      userId: context.userId,
      conversationId,
      type,
      filename: uploadFile.originalname,
      mimeType: uploadFile.mimetype,
      size: uploadFile.size,
      storageKey,
    });

    try {
      const result = await this.multimodalProvider.extract({
        buffer: uploadFile.buffer,
        filename: uploadFile.originalname,
        mimeType: uploadFile.mimetype,
        size: uploadFile.size,
        type,
      });
      const extractedAttachment = await this.multimodalRepository.update(attachment.id, {
        extractedText: result.extractedText,
        metadata: result.metadata,
        status: 'EXTRACTED',
      });

      return this.toResponse(extractedAttachment);
    } catch {
      await this.multimodalRepository.update(attachment.id, {
        status: 'FAILED',
      });
      throw new InternalServerErrorException('Multimodal extraction failed');
    }
  }

  async buildContext(
    context: ExecutionContext,
    attachmentIds: string[] | undefined,
    conversationId: string,
  ): Promise<MultimodalContext[]> {
    const uniqueAttachmentIds = [...new Set(attachmentIds ?? [])];

    if (uniqueAttachmentIds.length === 0) {
      return [];
    }

    const attachments = await this.multimodalRepository.findManyByIdsForUser(
      uniqueAttachmentIds,
      context.userId,
    );

    if (attachments.length !== uniqueAttachmentIds.length) {
      throw new ForbiddenException('One or more multimodal attachments are not accessible');
    }

    const attachmentById = new Map(attachments.map((attachment) => [attachment.id, attachment]));

    return uniqueAttachmentIds.map((attachmentId) => {
      const attachment = attachmentById.get(attachmentId);

      if (!attachment) {
        throw new ForbiddenException('Multimodal attachment is not accessible');
      }

      this.ensureAttachmentUsable(attachment, conversationId);

      return {
        attachmentId: attachment.id,
        content: attachment.extractedText,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        type: attachment.type,
      };
    });
  }

  private validateFile(file: UploadedMultimodalFile | undefined): UploadedMultimodalFile {
    if (!file) {
      throw new BadRequestException('Multimodal attachment file is required');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('Multimodal attachment file is empty');
    }

    const config = this.configService.getMultimodalConfig();

    if (file.size > config.maxFileSizeBytes) {
      throw new BadRequestException('Multimodal attachment exceeds size limit');
    }

    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported multimodal attachment type');
    }

    this.resolveAttachmentType(file);

    return file;
  }

  private resolveAttachmentType(file: UploadedMultimodalFile): MultimodalAttachmentType {
    if (file.mimetype.startsWith('image/')) {
      return 'IMAGE';
    }

    if (file.mimetype.startsWith('audio/')) {
      return 'AUDIO';
    }

    if (file.mimetype.startsWith('video/')) {
      return 'VIDEO';
    }

    throw new BadRequestException('Only image, audio, and video attachments are supported');
  }

  private ensureAttachmentUsable(
    attachment: MultimodalAttachmentEntity,
    conversationId: string,
  ): void {
    if (attachment.status !== 'EXTRACTED') {
      throw new BadRequestException('Multimodal attachment is not ready');
    }

    if (attachment.conversationId && attachment.conversationId !== conversationId) {
      throw new ForbiddenException('Multimodal attachment belongs to another conversation');
    }
  }

  private createObjectKey(userId: string, filename: string): string {
    return `multimodal/${userId}/${Date.now()}/${this.sanitizeFilename(filename)}`;
  }

  private sanitizeFilename(filename: string): string {
    const safeFilename = basename(filename)
      .replace(/[/\\]/g, '_')
      .replace(/[^a-zA-Z0-9._ -]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 200);

    return safeFilename || 'attachment.bin';
  }

  private toResponse(attachment: MultimodalAttachmentEntity): MultimodalAttachmentResponse {
    return {
      id: attachment.id,
      type: attachment.type,
      status: attachment.status === 'FAILED' ? 'FAILED' : 'EXTRACTED',
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      extractedText: attachment.extractedText,
      createdAt: attachment.createdAt,
    };
  }
}
