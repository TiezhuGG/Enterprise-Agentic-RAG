import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ObservabilityService } from '../../infrastructure/observability';
import { StorageService } from '../../infrastructure/storage';
import { DocumentRepository, type DocumentContentEntity, type DocumentEntity } from '../document';
import { ParserFactory } from './parser.factory';

@Injectable()
export class DocumentProcessingService {
  constructor(
    private readonly documentRepository: DocumentRepository,
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
      const markdown = await parser.parse(object.buffer);
      const content = await this.documentRepository.upsertContent(document.id, markdown);

      await this.documentRepository.update(document.id, {
        status: 'READY',
      });
      this.observabilityService.recordDocumentProcessing({
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
