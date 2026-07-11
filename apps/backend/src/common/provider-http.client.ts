import { HttpException } from '@nestjs/common';
import type { AppErrorCode } from './errors';
import { createAppServiceUnavailableException } from './errors';

const defaultProviderTimeoutMs = 30000;

export interface ProviderPostInput {
  apiKey: string;
  apiUrl: string;
  body: Record<string, unknown>;
  errorCode: Extract<
    AppErrorCode,
    'LLM_UNAVAILABLE' | 'EMBEDDING_UNAVAILABLE' | 'RERANKER_UNAVAILABLE'
  >;
  timeoutMs?: number;
}

export async function postProvider(input: ProviderPostInput): Promise<Response> {
  const abortController = new AbortController();
  const timeout = setTimeout(
    () => abortController.abort(),
    input.timeoutMs ?? defaultProviderTimeoutMs,
  );

  try {
    const response = await fetch(input.apiUrl, {
      body: JSON.stringify(input.body),
      headers: {
        authorization: `Bearer ${input.apiKey}`,
        'content-type': 'application/json',
      },
      method: 'POST',
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw createAppServiceUnavailableException(input.errorCode);
    }

    return response;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    throw createAppServiceUnavailableException(input.errorCode);
  } finally {
    clearTimeout(timeout);
  }
}

export async function postProviderJson<TPayload>(input: ProviderPostInput): Promise<TPayload> {
  const response = await postProvider(input);

  try {
    return (await response.json()) as TPayload;
  } catch {
    throw createAppServiceUnavailableException(input.errorCode);
  }
}
