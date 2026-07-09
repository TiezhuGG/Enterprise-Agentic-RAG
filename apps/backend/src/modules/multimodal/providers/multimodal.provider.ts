import type { MultimodalAttachmentType, MultimodalExtractionMetadata } from '../multimodal.types';

export const MULTIMODAL_PROVIDER = Symbol('MULTIMODAL_PROVIDER');

export interface MultimodalExtractionInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  type: MultimodalAttachmentType;
}

export interface MultimodalExtractionResult {
  extractedText: string;
  metadata: MultimodalExtractionMetadata;
}

export interface MultimodalProvider {
  extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult>;
}
