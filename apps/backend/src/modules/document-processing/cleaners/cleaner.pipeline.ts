import { Injectable } from '@nestjs/common';
import type { DocumentCleaningContext, DocumentCleaningResult } from '../document-processing.types';
import type { DocumentCleaner } from './document-cleaner.interface';
import { MarkdownCleaner } from './markdown.cleaner';

@Injectable()
export class CleanerPipeline {
  private readonly cleaners: DocumentCleaner[];

  constructor(markdownCleaner: MarkdownCleaner) {
    this.cleaners = [markdownCleaner];
  }

  clean(rawContent: string, context: DocumentCleaningContext): DocumentCleaningResult {
    return this.cleaners.reduce<DocumentCleaningResult>(
      (result, cleaner) => cleaner.clean(result.content, context),
      {
        content: rawContent,
        metadata: {
          addedTitleHeading: false,
          inputLength: rawContent.length,
          outputLength: rawContent.length,
          removedCharacterCount: 0,
        },
      },
    );
  }
}
