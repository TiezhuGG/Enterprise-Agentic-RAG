import { Injectable } from '@nestjs/common';
import type { DocumentType } from '../../document';
import type { DocumentParser } from '../document-parser.interface';

@Injectable()
export class MarkdownParser implements DocumentParser {
  supports(type: DocumentType): boolean {
    return type === 'MARKDOWN';
  }

  async parse(buffer: Buffer): Promise<string> {
    return buffer.toString('utf8').trim();
  }
}
