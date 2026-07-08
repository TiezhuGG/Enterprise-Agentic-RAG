import { Injectable } from '@nestjs/common';
import type {
  MultimodalExtractionInput,
  MultimodalExtractionResult,
  MultimodalProvider,
} from './multimodal.provider';

@Injectable()
export class MetadataMultimodalProvider implements MultimodalProvider {
  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    const kind = input.type === 'IMAGE' ? 'image' : 'audio';

    return {
      extractedText: [
        `Attached ${kind} file metadata:`,
        `- filename: ${input.filename}`,
        `- mimeType: ${input.mimeType}`,
        `- sizeBytes: ${input.size}`,
        '- extraction: metadata only; OCR/ASR provider is not enabled in this deployment.',
      ].join('\n'),
    };
  }
}
