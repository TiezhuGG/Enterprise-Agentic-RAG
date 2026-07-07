import { Module } from '@nestjs/common';
import { StorageModule } from '../../infrastructure/storage';
import { DocumentModule } from '../document';
import { DocumentProcessingService } from './document-processing.service';
import { ParserFactory } from './parser.factory';
import { DocxParser } from './parsers/docx.parser';
import { MarkdownParser } from './parsers/markdown.parser';
import { PdfParser } from './parsers/pdf.parser';
import { TxtParser } from './parsers/txt.parser';

@Module({
  imports: [DocumentModule, StorageModule],
  providers: [
    DocumentProcessingService,
    ParserFactory,
    PdfParser,
    DocxParser,
    TxtParser,
    MarkdownParser,
  ],
  exports: [DocumentProcessingService],
})
export class DocumentProcessingModule {}
