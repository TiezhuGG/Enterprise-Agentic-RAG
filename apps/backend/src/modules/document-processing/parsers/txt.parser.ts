import { Injectable } from '@nestjs/common';
import type { DocumentType } from '../../document';
import type { DocumentParser } from '../document-parser.interface';

@Injectable()
export class TxtParser implements DocumentParser {
  supports(type: DocumentType): boolean {
    return type === 'TXT';
  }

  async parse(buffer: Buffer): Promise<string> {
    return buffer.toString('utf8').trim();
  }
}
