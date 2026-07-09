import { Module } from '@nestjs/common';
import { StorageModule } from '../../infrastructure/storage';
import { DocumentModule } from '../document';
import { MultimodalModule } from '../multimodal';
import { CleanerPipeline } from './cleaners/cleaner.pipeline';
import { MarkdownCleaner } from './cleaners/markdown.cleaner';
import { DocumentProcessingService } from './document-processing.service';
import { DocumentMetadataBuilder } from './metadata/document-metadata.builder';
import { LanguageDetector } from './metadata/language.detector';
import { ParserFactory } from './parser.factory';
import { AudioParser } from './parsers/audio.parser';
import { DocxParser } from './parsers/docx.parser';
import { ImageParser } from './parsers/image.parser';
import { MarkdownParser } from './parsers/markdown.parser';
import { PdfParser } from './parsers/pdf.parser';
import { TxtParser } from './parsers/txt.parser';
import { VideoParser } from './parsers/video.parser';

@Module({
  imports: [DocumentModule, MultimodalModule, StorageModule],
  providers: [
    DocumentProcessingService,
    ParserFactory,
    PdfParser,
    DocxParser,
    TxtParser,
    MarkdownParser,
    ImageParser,
    AudioParser,
    VideoParser,
    CleanerPipeline,
    MarkdownCleaner,
    DocumentMetadataBuilder,
    LanguageDetector,
  ],
  exports: [DocumentProcessingService],
})
export class DocumentProcessingModule {}
