import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import type { MultimodalAttachmentType } from '../multimodal.types';
import type { AsrProvider } from './asr.provider';
import { MetadataAsrProvider } from './metadata-asr.provider';
import { MetadataOcrProvider } from './metadata-ocr.provider';
import { MetadataVideoUnderstandingProvider } from './metadata-video-understanding.provider';
import type {
  MultimodalExtractionInput,
  MultimodalExtractionResult,
  MultimodalProvider,
} from './multimodal.provider';
import type { OcrProvider } from './ocr.provider';
import { OpenAiCompatibleAsrProvider } from './openai-compatible-asr.provider';
import { OpenAiCompatibleOcrProvider } from './openai-compatible-ocr.provider';
import { OpenAiCompatibleVideoUnderstandingProvider } from './openai-compatible-video-understanding.provider';
import type { VideoUnderstandingProvider } from './video-understanding.provider';

@Injectable()
export class CompositeMultimodalProvider implements MultimodalProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly metadataAsrProvider: MetadataAsrProvider,
    private readonly metadataOcrProvider: MetadataOcrProvider,
    private readonly metadataVideoUnderstandingProvider: MetadataVideoUnderstandingProvider,
    private readonly openAiCompatibleAsrProvider: OpenAiCompatibleAsrProvider,
    private readonly openAiCompatibleOcrProvider: OpenAiCompatibleOcrProvider,
    private readonly openAiCompatibleVideoUnderstandingProvider: OpenAiCompatibleVideoUnderstandingProvider,
  ) {}

  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    return this.resolveProvider(input.type).extract(input);
  }

  private resolveProvider(
    type: MultimodalAttachmentType,
  ): OcrProvider | AsrProvider | VideoUnderstandingProvider {
    if (type === 'IMAGE') {
      return this.configService.getOcrConfig().provider === 'openai-compatible'
        ? this.openAiCompatibleOcrProvider
        : this.metadataOcrProvider;
    }

    if (type === 'AUDIO') {
      return this.configService.getAsrConfig().provider === 'openai-compatible'
        ? this.openAiCompatibleAsrProvider
        : this.metadataAsrProvider;
    }

    return this.configService.getVideoUnderstandingConfig().provider === 'openai-compatible'
      ? this.openAiCompatibleVideoUnderstandingProvider
      : this.metadataVideoUnderstandingProvider;
  }
}
