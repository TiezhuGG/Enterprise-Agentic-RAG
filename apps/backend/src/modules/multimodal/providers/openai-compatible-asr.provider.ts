import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';
import type { AsrProvider } from './asr.provider';
import { createAbortSignal, createMetadataResult, parseJsonResponse } from './provider-utils';

interface TranscriptionResponse {
  text?: unknown;
  language?: unknown;
  duration?: unknown;
  segments?: unknown;
}

@Injectable()
export class OpenAiCompatibleAsrProvider implements AsrProvider {
  constructor(private readonly configService: ConfigService) {}

  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    const config = this.configService.getAsrConfig();
    const formData = new FormData();

    formData.append('model', config.model);
    formData.append(
      'file',
      new Blob([new Uint8Array(input.buffer)], { type: input.mimeType }),
      input.filename,
    );
    formData.append('response_format', 'json');

    const response = await fetch(config.apiUrl, {
      body: formData,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      method: 'POST',
      signal: createAbortSignal(120_000),
    });
    const payload = await parseJsonResponse<TranscriptionResponse>(response);
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';

    if (!text) {
      throw new Error('ASR provider returned empty transcript');
    }

    return createMetadataResult(
      input,
      'audio',
      'openai-compatible',
      ['Audio transcript:', '', text],
      {
        duration: typeof payload.duration === 'number' ? payload.duration : undefined,
        language: typeof payload.language === 'string' ? payload.language : undefined,
        model: config.model,
        segmentCount: Array.isArray(payload.segments) ? payload.segments.length : undefined,
      },
    );
  }
}
