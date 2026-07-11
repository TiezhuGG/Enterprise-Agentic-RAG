import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { StoredObject } from '../../../infrastructure/storage';
import type {
  DocumentContentCleanerMetadata,
  DocumentContentMetadata,
  DocumentEntity,
} from '../../document';
import type { DocumentCleaningMetadata } from '../document-processing.types';
import { LanguageDetector } from './language.detector';

@Injectable()
export class DocumentMetadataBuilder {
  constructor(private readonly languageDetector: LanguageDetector) {}

  build(
    document: DocumentEntity,
    object: StoredObject,
    cleanedContent: string,
    cleaningMetadata: DocumentCleaningMetadata,
    parserMetadata: Record<string, unknown> = {},
  ): DocumentContentMetadata {
    const metadata: DocumentContentMetadata = {
      ...parserMetadata,
      documentId: document.id,
      spaceId: document.spaceId,
      documentType: document.type,
      language: this.languageDetector.detect(cleanedContent),
      securityLevel: document.accessScope.securityLevel,
      sourceHash: this.sha256(object.buffer),
      contentHash: this.sha256(cleanedContent),
      contentLength: cleanedContent.length,
      lineCount: this.countLines(cleanedContent),
      parser: document.type,
      cleaner: this.toCleanerMetadata(cleaningMetadata),
      processedAt: new Date().toISOString(),
    };

    const mimeType = document.mimeType ?? object.contentType;
    const storageKey = document.storageKey ?? object.key;
    const size = document.size ?? object.size;

    if (mimeType) {
      metadata.mimeType = mimeType;
    }

    if (storageKey) {
      metadata.storageKey = storageKey;
    }

    if (typeof size === 'number' && Number.isFinite(size)) {
      metadata.size = size;
    }

    if (document.accessScope.departmentId) {
      metadata.departmentId = document.accessScope.departmentId;
    }

    if (document.accessScope.allowedDepartmentIds?.length) {
      metadata.allowedDepartmentIds = document.accessScope.allowedDepartmentIds;
    }

    return metadata;
  }

  private sha256(value: Buffer | string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private countLines(content: string): number {
    if (!content) {
      return 0;
    }

    return content.split('\n').length;
  }

  private toCleanerMetadata(metadata: DocumentCleaningMetadata): DocumentContentCleanerMetadata {
    return {
      addedTitleHeading: metadata.addedTitleHeading,
      inputLength: metadata.inputLength,
      outputLength: metadata.outputLength,
      removedCharacterCount: metadata.removedCharacterCount,
    };
  }
}
