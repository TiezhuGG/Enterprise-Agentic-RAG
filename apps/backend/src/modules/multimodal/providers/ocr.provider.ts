import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';

export interface OcrProvider {
  extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult>;
}
