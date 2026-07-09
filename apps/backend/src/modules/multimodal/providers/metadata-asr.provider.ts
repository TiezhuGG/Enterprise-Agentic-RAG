import { Injectable } from '@nestjs/common';
import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';
import type { AsrProvider } from './asr.provider';
import { createMetadataResult } from './provider-utils';

@Injectable()
export class MetadataAsrProvider implements AsrProvider {
  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    return createMetadataResult(input, 'audio', 'metadata', [
      'Audio transcript metadata:',
      `- filename: ${input.filename}`,
      `- mimeType: ${input.mimeType}`,
      `- sizeBytes: ${input.size}`,
      '- extraction: metadata only; ASR provider is not enabled in this deployment.',
    ]);
  }
}
