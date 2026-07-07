import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { StorageService } from '../../infrastructure/storage';
import { DocumentRepository, type DocumentContentEntity, type DocumentEntity } from '../document';
import { ParserFactory } from './parser.factory';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly parserFactory: ParserFactory,
    private readonly storageService: StorageService,
  ) {}

  async processDocument(documentId: string): Promise<DocumentContentEntity> {
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

      return content;
    } catch (error) {
      await this.documentRepository.update(document.id, {
        status: 'FAILED',
      });
      this.logger.error(`Failed to process document ${document.id}`, error);
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
