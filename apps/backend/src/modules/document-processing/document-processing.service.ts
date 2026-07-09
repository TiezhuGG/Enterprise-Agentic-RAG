import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ObservabilityService } from '../../infrastructure/observability';
import { StorageService } from '../../infrastructure/storage';
import { DocumentRepository, type DocumentContentEntity, type DocumentEntity } from '../document';
import { CleanerPipeline } from './cleaners/cleaner.pipeline';
import { DocumentMetadataBuilder } from './metadata/document-metadata.builder';
import { ParserFactory } from './parser.factory';

@Injectable()
export class DocumentProcessingService {
  constructor(
    private readonly cleanerPipeline: CleanerPipeline,
    private readonly documentRepository: DocumentRepository,
    private readonly documentMetadataBuilder: DocumentMetadataBuilder,
    private readonly observabilityService: ObservabilityService,
    private readonly parserFactory: ParserFactory,
    private readonly storageService: StorageService,
  ) {}

  async processDocument(documentId: string): Promise<DocumentContentEntity> {
    const startedAt = Date.now();
    const document = await this.findActiveDocument(documentId);

    try {
      if (document.status !== 'PROCESSING') {
        throw new BadRequestException('Document must be in PROCESSING status');
      }

      if (!document.storageKey) {
        throw new BadRequestException('Document storage key is required for processing');
      }

      const object = await this.storageService.getObject(document.storageKey);
      const parser = this.parserFactory.getParser(document.type);
      const rawMarkdown = await parser.parse(object.buffer, {
        documentId: document.id,
        mimeType: document.mimeType ?? object.contentType,
        size: document.size ?? object.size,
        storageKey: document.storageKey,
        title: document.title,
        type: document.type,
      });
      const cleanedMarkdown = this.cleanerPipeline.clean(rawMarkdown, {
        documentId: document.id,
        title: document.title,
        type: document.type,
      });
      const metadata = this.documentMetadataBuilder.build(
        document,
        object,
        cleanedMarkdown.content,
        cleanedMarkdown.metadata,
      );
      const content = await this.documentRepository.upsertContent(
        document.id,
        cleanedMarkdown.content,
        metadata,
      );

      await this.documentRepository.update(document.id, {
        status: 'READY',
      });
      this.observabilityService.recordDocumentProcessing({
        cleaning: cleanedMarkdown.metadata,
        documentId: document.id,
        durationMs: Date.now() - startedAt,
        status: 'success',
      });

      return content;
    } catch (error) {
      await this.documentRepository.update(document.id, {
        status: 'FAILED',
      });
      this.observabilityService.recordDocumentProcessing({
        documentId: document.id,
        durationMs: Date.now() - startedAt,
        error,
        status: 'failed',
      });
      throw error;
    }
  }

  private async findActiveDocument(documentId: string): Promise<DocumentEntity> {
    const document = await this.documentRepository.findActiveById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }
}
