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

const providerErrorMaxLength = 800;

const stringifyProviderErrorDetail = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return typeof payload === 'string' ? payload : '';
  }

  const response = payload as {
    detail?: unknown;
    error?: unknown;
    message?: unknown;
  };
  const detail = response.error ?? response.message ?? response.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (detail) {
    return JSON.stringify(detail);
  }

  return JSON.stringify(payload);
};

const readProviderError = async (response: Response): Promise<string> => {
  const prefix = `Provider request failed with status ${response.status}`;
  let body = '';

  try {
    body = await response.text();
  } catch {
    return prefix;
  }

  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return prefix;
  }

  let detail = trimmedBody;

  try {
    detail = stringifyProviderErrorDetail(JSON.parse(trimmedBody));
  } catch {
    detail = trimmedBody;
  }

  const compactDetail = detail.replace(/\s+/g, ' ').trim();

  if (!compactDetail) {
    return prefix;
  }

  return `${prefix}: ${compactDetail.slice(0, providerErrorMaxLength)}`;
};

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
    throw new Error(await readProviderError(response));
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
