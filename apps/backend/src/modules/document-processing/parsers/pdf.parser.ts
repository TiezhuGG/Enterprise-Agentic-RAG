import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import type { DocumentType } from '../../document';
import type { DocumentParser } from '../document-parser.interface';

@Injectable()
export class PdfParser implements DocumentParser {
  supports(type: DocumentType): boolean {
    return type === 'PDF';
  }

  async parse(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();

      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }
}
