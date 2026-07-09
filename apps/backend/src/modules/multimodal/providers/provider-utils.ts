import type { MultimodalExtractionInput, MultimodalExtractionResult } from './multimodal.provider';
import type { MultimodalModality } from '../multimodal.types';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  output_text?: unknown;
  text?: unknown;
}

export const toDataUrl = (input: MultimodalExtractionInput): string =>
  `data:${input.mimeType};base64,${input.buffer.toString('base64')}`;

export const createMetadataResult = (
  input: MultimodalExtractionInput,
  modality: MultimodalModality,
  provider: string,
  lines: string[],
  extraMetadata: Record<string, unknown> = {},
): MultimodalExtractionResult => ({
  extractedText: lines.join('\n'),
  metadata: {
    filename: input.filename,
    mimeType: input.mimeType,
    modality,
    processedAt: new Date().toISOString(),
    provider,
    size: input.size,
    ...extraMetadata,
  },
});

export const extractChatCompletionText = (payload: unknown): string => {
  const response = payload as ChatCompletionResponse;
  const choiceContent = response.choices?.[0]?.message?.content;
  const content = choiceContent ?? response.output_text ?? response.text;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object' && 'text' in item) {
          const text = (item as { text?: unknown }).text;

          return typeof text === 'string' ? text : '';
        }

        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
};

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Provider request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

export const createAbortSignal = (timeoutMs = 60_000): AbortSignal => {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  if (typeof timeout === 'object' && 'unref' in timeout) {
    timeout.unref();
  }

  return abortController.signal;
};
