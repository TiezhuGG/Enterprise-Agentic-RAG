import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';
import type { OcrProvider } from './ocr.provider';
import {
  createAbortSignal,
  createMetadataResult,
  extractChatCompletionText,
  parseJsonResponse,
  toDataUrl,
} from './provider-utils';

@Injectable()
export class OpenAiCompatibleOcrProvider implements OcrProvider {
  constructor(private readonly configService: ConfigService) {}

  async extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult> {
    const config = this.configService.getOcrConfig();
    const response = await fetch(config.apiUrl, {
      body: JSON.stringify({
        max_tokens: 1200,
        messages: [
          {
            content: [
              {
                text: [
                  'Extract readable text from this image.',
                  'Return concise Markdown.',
                  'Do not invent text that is not visible.',
                ].join(' '),
                type: 'text',
              },
              {
                image_url: {
                  url: toDataUrl(input),
                },
                type: 'image_url',
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
      signal: createAbortSignal(),
    });
    const payload = await parseJsonResponse(response);
    const text = extractChatCompletionText(payload);

    if (!text) {
      throw new Error('OCR provider returned empty text');
    }

    return createMetadataResult(input, 'image', 'openai-compatible', [text], {
      model: config.model,
    });
  }
}
