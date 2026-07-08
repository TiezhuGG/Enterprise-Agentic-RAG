import type { DocumentType } from '../document';

export interface DocumentCleaningContext {
  documentId: string;
  title: string;
  type: DocumentType;
}

export interface DocumentCleaningMetadata extends Record<string, unknown> {
  inputLength: number;
  outputLength: number;
  removedCharacterCount: number;
  addedTitleHeading: boolean;
}

export interface DocumentCleaningResult {
  content: string;
  metadata: DocumentCleaningMetadata;
}
