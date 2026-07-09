import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import type { DocumentType } from '../../document';
import type { DocumentParser } from '../document-parser.interface';

const pageMarkerPattern = /^--\s*\d+\s+of\s+\d+\s*--$/i;

@Injectable()
export class PdfParser implements DocumentParser {
  supports(type: DocumentType): boolean {
    return type === 'PDF';
  }

  async parse(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const text = result.text.trim();
      const readableText = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !pageMarkerPattern.test(line))
        .join('\n')
        .trim();

      if (!readableText) {
        throw new BadRequestException('PDF text extraction produced no readable content');
      }

      return text;
    } finally {
      await parser.destroy();
    }
  }
}
