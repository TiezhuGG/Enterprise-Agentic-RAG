import { apiBaseUrl } from '@/lib/env';

const authTokenStorageKey = 'enterprise-agentic-rag.authToken';

const apiErrorMessages: Record<string, string> = {
  EMBEDDING_UNAVAILABLE: '向量模型不可用',
  GRAPH_UNAVAILABLE: '图谱服务未连接',
  LLM_UNAVAILABLE: '大模型服务不可用',
  RERANKER_UNAVAILABLE: '重排序服务不可用',
  UNSUPPORTED_FILE_TYPE: '文件格式暂不支持',
};

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
  const fallbackMessage = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as { code?: string; message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    const localizedMessage =
      (body.code ? apiErrorMessages[body.code] : undefined) ?? message ?? fallbackMessage;

    return new ApiClientError(localizedMessage, response.status, body.code);
  } catch {
    return new ApiClientError(fallbackMessage, response.status);
  }
};
