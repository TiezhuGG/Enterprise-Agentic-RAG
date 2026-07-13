import type { LoginRequest, LoginResponse } from '@/types/auth';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const authService = {
  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<LoginResponse> {
    const response = await fetch(createApiUrl('/auth/change-password'), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) throw await readApiError(response);
    return (await response.json()) as LoginResponse;
  },

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
