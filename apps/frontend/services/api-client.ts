import { apiBaseUrl } from '@/lib/env';

const authTokenStorageKey = 'enterprise-agentic-rag.authToken';

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
    const body = (await response.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;

    return new Error(message ?? fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
};
