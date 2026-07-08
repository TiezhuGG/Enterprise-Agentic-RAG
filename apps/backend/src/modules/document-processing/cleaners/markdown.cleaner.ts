import { BadRequestException, Injectable } from '@nestjs/common';
import type { DocumentCleaningContext, DocumentCleaningResult } from '../document-processing.types';
import type { DocumentCleaner } from './document-cleaner.interface';

const topLevelHeadingPattern = /^#{1,2}\s+\S/;

@Injectable()
export class MarkdownCleaner implements DocumentCleaner {
  clean(content: string, context: DocumentCleaningContext): DocumentCleaningResult {
    const inputLength = content.length;
    const normalizedContent = this.normalizeNewlines(content);
    const withoutInvalidCharacters = this.removeInvalidControlCharacters(normalizedContent);
    const cleanedContent = this.cleanMarkdownLines(withoutInvalidCharacters);
    const contentWithoutTitle = this.trimOuterBlankLines(cleanedContent);

    if (!contentWithoutTitle.trim()) {
      throw new BadRequestException('Document content is empty after cleaning');
    }

    const addedTitleHeading = !this.hasTopLevelHeading(contentWithoutTitle);
    const finalContent = addedTitleHeading
      ? `${this.createTitleHeading(context.title)}\n\n${contentWithoutTitle}`
      : contentWithoutTitle;

    return {
      content: finalContent,
      metadata: {
        addedTitleHeading,
        inputLength,
        outputLength: finalContent.length,
        removedCharacterCount: Math.max(0, inputLength - contentWithoutTitle.length),
      },
    };
  }

  private normalizeNewlines(content: string): string {
    return content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  }

  private removeInvalidControlCharacters(content: string): string {
    let output = '';

    for (const character of content) {
      const code = character.charCodeAt(0);

      if ((code >= 0x00 && code <= 0x08) || code === 0x0b || code === 0x0c) {
        continue;
      }

      if ((code >= 0x0e && code <= 0x1f) || code === 0x7f) {
        continue;
      }

      output += character;
    }

    return output;
  }

  private cleanMarkdownLines(content: string): string {
    const lines = content.split('\n');
    const outputLines: string[] = [];
    let blankLineCount = 0;
    let inCodeFence = false;

    for (const line of lines) {
      const isFence = this.isFence(line);

      if (inCodeFence) {
        outputLines.push(line);

        if (isFence) {
          inCodeFence = false;
        }

        continue;
      }

      const cleanLine = line.replace(/[ \t]+$/g, '');

      if (isFence) {
        outputLines.push(cleanLine);
        inCodeFence = true;
        blankLineCount = 0;
        continue;
      }

      if (!cleanLine.trim()) {
        blankLineCount += 1;

        if (blankLineCount <= 2) {
          outputLines.push('');
        }

        continue;
      }

      blankLineCount = 0;
      outputLines.push(cleanLine);
    }

    return outputLines.join('\n');
  }

  private trimOuterBlankLines(content: string): string {
    const lines = content.split('\n');

    while (lines.length > 0 && !lines[0].trim()) {
      lines.shift();
    }

    while (lines.length > 0 && !lines[lines.length - 1].trim()) {
      lines.pop();
    }

    return lines.join('\n');
  }

  private hasTopLevelHeading(content: string): boolean {
    let inCodeFence = false;

    for (const line of content.split('\n')) {
      const isFence = this.isFence(line);

      if (isFence) {
        inCodeFence = !inCodeFence;
        continue;
      }

      if (!inCodeFence && topLevelHeadingPattern.test(line)) {
        return true;
      }
    }

    return false;
  }

  private createTitleHeading(title: string): string {
    const normalizedTitle = title.replace(/\s+/g, ' ').trim();

    return `# ${normalizedTitle || 'Untitled document'}`;
  }

  private isFence(line: string): boolean {
    const trimmedLine = line.trim();

    return trimmedLine.startsWith('```') || trimmedLine.startsWith('~~~');
  }
}
