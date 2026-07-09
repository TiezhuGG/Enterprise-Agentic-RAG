import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { basename, extname, parse } from 'node:path';
import type { ExecutionContext } from '../../common';
import { ObservabilityService } from '../../infrastructure/observability';
import { StorageService } from '../../infrastructure/storage';
import { DocumentRepository, type DocumentEntity, type DocumentType } from '../document';
import { KnowledgeSpaceRepository, type SpaceMemberRole } from '../knowledge-space';
import type { UploadDocumentDto } from './dto/upload-document.dto';
import {
  allowedUploadMimeTypes,
  extensionDocumentTypeMap,
  maxUploadFileSizeBytes,
  type UploadedDocumentFile,
} from './upload.types';

const writeRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR'];

@Injectable()
export class UploadService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly knowledgeSpaceRepository: KnowledgeSpaceRepository,
    private readonly observabilityService: ObservabilityService,
    private readonly storageService: StorageService,
  ) {}

  async uploadDocument(
    context: ExecutionContext,
    spaceId: string,
    input: UploadDocumentDto,
    file: UploadedDocumentFile | undefined,
  ): Promise<DocumentEntity> {
    const startedAt = Date.now();
    let uploadFile: UploadedDocumentFile | undefined;

    try {
      uploadFile = this.validateFile(file);
      await this.ensureSpaceRole(context, spaceId);

      const document = await this.documentRepository.create({
        spaceId,
        title: this.resolveTitle(input.title, uploadFile.originalname),
        description: input.description,
        type: this.resolveDocumentType(uploadFile),
        mimeType: uploadFile.mimetype,
        size: uploadFile.size,
        createdBy: context.userId,
      });
      const storageKey = this.createObjectKey(spaceId, document.id, uploadFile.originalname);

      try {
        await this.storageService.uploadObject(storageKey, uploadFile.buffer, uploadFile.mimetype);
      } catch {
        await this.documentRepository.update(document.id, {
          status: 'FAILED',
        });
        throw new InternalServerErrorException('Document upload failed');
      }

      const updatedDocument = await this.documentRepository.update(document.id, {
        storageKey,
        status: 'PROCESSING',
      });

      this.observabilityService.recordUpload({
        context,
        durationMs: Date.now() - startedAt,
        mimeType: uploadFile.mimetype,
        size: uploadFile.size,
        spaceId,
        status: 'success',
      });

      return updatedDocument;
    } catch (error) {
      this.observabilityService.recordUpload({
        context,
        durationMs: Date.now() - startedAt,
        error,
        mimeType: uploadFile?.mimetype,
        size: uploadFile?.size,
        spaceId,
        status: 'failed',
      });
      throw error;
    }
  }

  private validateFile(file: UploadedDocumentFile | undefined): UploadedDocumentFile {
    if (!file) {
      throw new BadRequestException('Upload file is required');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('Upload file is empty');
    }

    if (file.size > maxUploadFileSizeBytes) {
      throw new BadRequestException('Upload file exceeds 50MB limit');
    }

    this.resolveDocumentType(file);

    return file;
  }

  private resolveDocumentType(file: UploadedDocumentFile): DocumentType {
    if (
      file.mimetype.startsWith('image/') &&
      (allowedUploadMimeTypes as readonly string[]).includes(file.mimetype)
    ) {
      return 'IMAGE';
    }

    if (
      file.mimetype.startsWith('audio/') &&
      (allowedUploadMimeTypes as readonly string[]).includes(file.mimetype)
    ) {
      return 'AUDIO';
    }

    if (
      file.mimetype.startsWith('video/') &&
      (allowedUploadMimeTypes as readonly string[]).includes(file.mimetype)
    ) {
      return 'VIDEO';
    }

    const extension = extname(file.originalname).toLowerCase();
    const type = extensionDocumentTypeMap[extension];

    if (type && (allowedUploadMimeTypes as readonly string[]).includes(file.mimetype)) {
      return type;
    }

    throw new BadRequestException('Unsupported document file type');
  }

  private resolveTitle(title: string | undefined, filename: string): string {
    const normalizedTitle = title?.trim();

    if (normalizedTitle) {
      return normalizedTitle;
    }

    const parsedFilename = parse(filename);
    const fallbackTitle = parsedFilename.name.trim() || parsedFilename.base.trim();

    return fallbackTitle || 'Untitled document';
  }

  private createObjectKey(spaceId: string, documentId: string, filename: string): string {
    return `${spaceId}/${documentId}/${Date.now()}/${this.sanitizeFilename(filename)}`;
  }

  private sanitizeFilename(filename: string): string {
    const safeFilename = basename(filename)
      .replace(/[/\\]/g, '_')
      .replace(/[^a-zA-Z0-9._ -]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 200);

    return safeFilename || 'upload.bin';
  }

  private async ensureSpaceRole(context: ExecutionContext, spaceId: string): Promise<void> {
    const space = await this.knowledgeSpaceRepository.findAccessibleById(
      spaceId,
      context.userId,
      context.tenantId,
    );

    if (!space) {
      throw new NotFoundException('Knowledge space not found');
    }

    const member = space.members.find((spaceMember) => spaceMember.userId === context.userId);

    if (!member || !writeRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient knowledge space role');
    }
  }
}
