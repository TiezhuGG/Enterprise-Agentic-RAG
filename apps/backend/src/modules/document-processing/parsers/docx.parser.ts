import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import type { DocumentType } from '../../document';
import type { DocumentParser } from '../document-parser.interface';

const stripHtml = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

@Injectable()
export class DocxParser implements DocumentParser {
  supports(type: DocumentType): boolean {
    return type === 'WORD';
  }

  async parse(buffer: Buffer): Promise<string> {
    const result = await mammoth.convertToHtml({ buffer });

    return stripHtml(result.value);
  }
}
