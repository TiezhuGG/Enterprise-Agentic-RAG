import { BadRequestException, Injectable } from '@nestjs/common';
import type { DocumentType } from '../document';
import type { DocumentParser } from './document-parser.interface';
import { DocxParser } from './parsers/docx.parser';
import { MarkdownParser } from './parsers/markdown.parser';
import { PdfParser } from './parsers/pdf.parser';
import { TxtParser } from './parsers/txt.parser';

@Injectable()
export class ParserFactory {
  private readonly parsers: DocumentParser[];

  constructor(
    pdfParser: PdfParser,
    docxParser: DocxParser,
    txtParser: TxtParser,
    markdownParser: MarkdownParser,
  ) {
    this.parsers = [pdfParser, docxParser, txtParser, markdownParser];
  }

  getParser(type: DocumentType): DocumentParser {
    const parser = this.parsers.find((candidate) => candidate.supports(type));

    if (!parser) {
      throw new BadRequestException(`Unsupported document type for processing: ${type}`);
    }

    return parser;
  }
}
