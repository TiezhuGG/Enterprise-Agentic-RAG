import { Injectable } from '@nestjs/common';
import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';
import type { OcrProvider } from './ocr.provider';
import { createMetadataResult } from './provider-utils';

@Injectable()
export class MetadataOcrProvider implements OcrProvider {
  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    return createMetadataResult(input, 'image', 'metadata', [
      'Image OCR metadata:',
      `- filename: ${input.filename}`,
      `- mimeType: ${input.mimeType}`,
      `- sizeBytes: ${input.size}`,
      '- extraction: metadata only; OCR provider is not enabled in this deployment.',
    ]);
  }
}
