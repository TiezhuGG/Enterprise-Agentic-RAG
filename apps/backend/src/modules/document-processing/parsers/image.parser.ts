import { Inject, Injectable } from '@nestjs/common';
import type { DocumentType } from '../../document';
import {
  MULTIMODAL_PROVIDER,
  type MultimodalProvider,
} from '../../multimodal/providers/multimodal.provider';
import type { DocumentParser, DocumentParserContext } from '../document-parser.interface';

@Injectable()
export class ImageParser implements DocumentParser {
  constructor(
    @Inject(MULTIMODAL_PROVIDER)
    private readonly multimodalProvider: MultimodalProvider,
  ) {}

  supports(type: DocumentType): boolean {
    return type === 'IMAGE';
  }

  async parse(buffer: Buffer, context: DocumentParserContext): Promise<string> {
    const result = await this.multimodalProvider.extract({
      buffer,
      filename: context.title,
      mimeType: context.mimeType ?? 'application/octet-stream',
      size: context.size ?? buffer.length,
      type: 'IMAGE',
    });

    return result.extractedText;
  }
}
