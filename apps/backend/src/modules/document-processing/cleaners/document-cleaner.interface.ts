import type { DocumentCleaningContext, DocumentCleaningResult } from '../document-processing.types';

export interface DocumentCleaner {
  clean(content: string, context: DocumentCleaningContext): DocumentCleaningResult;
}
