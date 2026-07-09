import { Injectable } from '@nestjs/common';
import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';
import { createMetadataResult } from './provider-utils';
import type { VideoUnderstandingProvider } from './video-understanding.provider';

@Injectable()
export class MetadataVideoUnderstandingProvider implements VideoUnderstandingProvider {
  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    return createMetadataResult(input, 'video', 'metadata', [
      'Video understanding metadata:',
      `- filename: ${input.filename}`,
      `- mimeType: ${input.mimeType}`,
      `- sizeBytes: ${input.size}`,
      '- extraction: metadata only; video understanding provider is not enabled in this deployment.',
    ]);
  }
}
