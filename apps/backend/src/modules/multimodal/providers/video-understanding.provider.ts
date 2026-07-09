import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';

export interface VideoUnderstandingProvider {
  extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult>;
}
