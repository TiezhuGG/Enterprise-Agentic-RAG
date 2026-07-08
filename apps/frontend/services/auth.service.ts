import type { LoginRequest, LoginResponse } from '@/types/auth';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const authService = {
  async login(input: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(createApiUrl('/auth/login'), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as LoginResponse;
  },
};
