import { BadRequestException, Injectable } from '@nestjs/common';
import type { DocumentType } from '../document';
import type { DocumentParser } from './document-parser.interface';
import { DocxParser } from './parsers/docx.parser';
import { AudioParser } from './parsers/audio.parser';
import { ImageParser } from './parsers/image.parser';
import { MarkdownParser } from './parsers/markdown.parser';
import { PdfParser } from './parsers/pdf.parser';
import { TxtParser } from './parsers/txt.parser';
import { VideoParser } from './parsers/video.parser';

@Injectable()
export class ParserFactory {
  private readonly parsers: DocumentParser[];

  constructor(
    pdfParser: PdfParser,
    docxParser: DocxParser,
    txtParser: TxtParser,
    markdownParser: MarkdownParser,
    imageParser: ImageParser,
    audioParser: AudioParser,
    videoParser: VideoParser,
  ) {
    this.parsers = [
      pdfParser,
      docxParser,
      txtParser,
      markdownParser,
      imageParser,
      audioParser,
      videoParser,
    ];
  }

  getParser(type: DocumentType): DocumentParser {
    const parser = this.parsers.find((candidate) => candidate.supports(type));

    if (!parser) {
      throw new BadRequestException(`Unsupported document type for processing: ${type}`);
    }

    return parser;
  }
}
