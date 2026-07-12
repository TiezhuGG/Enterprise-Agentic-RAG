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
      throw createAppServiceUnavailableException(
        input.errorCode,
        getProviderFailureMessage(input.errorCode, response.status),
      );
    }

    return response;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    throw createAppServiceUnavailableException(
      input.errorCode,
      getProviderNetworkFailureMessage(input.errorCode, error),
    );
  } finally {
    clearTimeout(timeout);
  }
}

const getProviderFailureMessage = (
  errorCode: ProviderPostInput['errorCode'],
  status: number,
): string | undefined => {
  if (errorCode !== 'LLM_UNAVAILABLE') {
    return undefined;
  }

  if (status === 401 || status === 403) {
    return '大模型服务鉴权失败，请检查接口密钥和模型访问权限';
  }

  if (status === 429) {
    return '大模型服务限流或额度已耗尽，请稍后重试或切换模型';
  }

  if (status >= 500) {
    return '大模型服务暂时不可用，请稍后重试';
  }

  return undefined;
};

const getProviderNetworkFailureMessage = (
  errorCode: ProviderPostInput['errorCode'],
  error: unknown,
): string | undefined => {
  if (errorCode !== 'LLM_UNAVAILABLE') {
    return undefined;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return '大模型请求超时，请检查网关服务状态或网络链路';
  }

  switch (getNetworkErrorCode(error)) {
    case 'ECONNRESET':
      return '大模型网关主动断开连接，请检查 LLM_API_URL、网关服务状态或网络代理';
    case 'ECONNREFUSED':
      return '无法连接大模型网关，请检查 LLM_API_URL 和服务端口';
    case 'ENOTFOUND':
      return '无法解析大模型网关域名，请检查 LLM_API_URL 和 DNS 配置';
    default:
      return undefined;
  }
};

const getNetworkErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as { cause?: unknown; code?: unknown };
  const directCode = typeof candidate.code === 'string' ? candidate.code : null;

  if (directCode) {
    return directCode;
  }

  if (!candidate.cause || typeof candidate.cause !== 'object') {
    return null;
  }

  const cause = candidate.cause as { code?: unknown };

  return typeof cause.code === 'string' ? cause.code : null;
};

export async function postProviderJson<TPayload>(input: ProviderPostInput): Promise<TPayload> {
  const response = await postProvider(input);

  try {
    return (await response.json()) as TPayload;
  } catch {
    throw createAppServiceUnavailableException(input.errorCode);
  }
}
