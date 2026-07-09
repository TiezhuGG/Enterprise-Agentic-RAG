import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';
import {
  createAbortSignal,
  createMetadataResult,
  extractChatCompletionText,
  parseJsonResponse,
  toDataUrl,
} from './provider-utils';
import type { VideoUnderstandingProvider } from './video-understanding.provider';

@Injectable()
export class OpenAiCompatibleVideoUnderstandingProvider implements VideoUnderstandingProvider {
  constructor(private readonly configService: ConfigService) {}

  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    const config = this.configService.getVideoUnderstandingConfig();
    const response = await fetch(config.apiUrl, {
      body: JSON.stringify({
        max_tokens: 1800,
        messages: [
          {
            content: [
              {
                text: [
                  'Understand this video and return Markdown.',
                  'Include a short summary and timeline snippets when possible.',
                  'Do not invent details that are not visible or audible.',
                ].join(' '),
                type: 'text',
              },
              {
                input_video: {
                  data: toDataUrl(input),
                  mime_type: input.mimeType,
                },
                type: 'input_video',
              },
            ],
            role: 'user',
          },
        ],
        model: config.model,
        temperature: 0,
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: createAbortSignal(180_000),
    });
    const payload = await parseJsonResponse(response);
    const text = extractChatCompletionText(payload);

    if (!text) {
      throw new Error('Video understanding provider returned empty text');
    }

    return createMetadataResult(input, 'video', 'openai-compatible', [text], {
      model: config.model,
    });
  }
}
