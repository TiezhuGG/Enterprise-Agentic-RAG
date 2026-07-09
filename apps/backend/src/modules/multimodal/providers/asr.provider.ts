import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';

export interface AsrProvider {
  extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult>;
}
