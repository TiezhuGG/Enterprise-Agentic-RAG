import { Injectable } from '@nestjs/common';
import type {
  MultimodalExtractionInput,
  MultimodalExtractionResult,
  MultimodalProvider,
} from './multimodal.provider';
import { createMetadataResult } from './provider-utils';

@Injectable()
export class MetadataMultimodalProvider implements MultimodalProvider {
  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    const kind = input.type === 'IMAGE' ? 'image' : input.type === 'AUDIO' ? 'audio' : 'video';

    return createMetadataResult(input, kind, 'metadata', [
      `Attached ${kind} file metadata:`,
      `- filename: ${input.filename}`,
      `- mimeType: ${input.mimeType}`,
      `- sizeBytes: ${input.size}`,
      '- extraction: metadata only; multimodal provider is not enabled in this deployment.',
    ]);
  }
}
