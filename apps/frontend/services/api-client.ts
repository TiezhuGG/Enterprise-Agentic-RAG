import { apiBaseUrl } from '@/lib/env';
import { getAppErrorMessage, toShortSafeMessage } from '@/lib/error-copy';

const authTokenStorageKey = 'enterprise-agentic-rag.authToken';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export const getAuthToken = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(authTokenStorageKey) ?? '';
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedToken = token.trim();

  if (normalizedToken) {
    window.localStorage.setItem(authTokenStorageKey, normalizedToken);
    return;
  }

  window.localStorage.removeItem(authTokenStorageKey);
};

export const createApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (apiBaseUrl.endsWith('/')) {
    return `${apiBaseUrl.slice(0, -1)}${normalizedPath}`;
  }

  return `${apiBaseUrl}${normalizedPath}`;
};

export const createJsonHeaders = (): HeadersInit => {
  const token = getAuthToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
};

export const readApiError = async (response: Response): Promise<Error> => {
  const fallbackMessage = `请求失败，状态码 ${response.status}`;

  try {
    const body = (await response.json()) as { code?: string; message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    const safeMessage = toShortSafeMessage(message ?? '');
    const preserveProviderMessage = body.code === 'LLM_UNAVAILABLE';
    const localizedMessage =
      (preserveProviderMessage && safeMessage
        ? safeMessage
        : getAppErrorMessage(body.code) ?? safeMessage) || fallbackMessage;

    return new ApiClientError(localizedMessage, response.status, body.code);
  } catch {
    return new ApiClientError(fallbackMessage, response.status);
  }
};
