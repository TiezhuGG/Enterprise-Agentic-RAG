import type { AuthorizationAuditRole, AuthorizationAuditUser } from '@/types/governance';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const authorizationAuditService = {
  async createUser(input: {
    departmentId: string;
    email: string;
    name: string;
    systemRole: 'admin' | 'user';
    temporaryPassword: string;
  }): Promise<void> {
    const response = await fetch(createApiUrl('/auth/governance/users'), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'POST',
    });
    if (!response.ok) throw await readApiError(response);
  },

  async listRoles(): Promise<AuthorizationAuditRole[]> {
    const response = await fetch(createApiUrl('/auth/governance/roles'), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as AuthorizationAuditRole[];
  },

  async listUsers(): Promise<AuthorizationAuditUser[]> {
    const response = await fetch(createApiUrl('/auth/governance/users'), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as AuthorizationAuditUser[];
  },

  async resetUserPassword(userId: string, temporaryPassword: string): Promise<void> {
    const response = await fetch(createApiUrl(`/auth/governance/users/${userId}/reset-password`), {
      body: JSON.stringify({ temporaryPassword }),
      headers: createJsonHeaders(),
      method: 'POST',
    });
    if (!response.ok) throw await readApiError(response);
  },

  async updateUser(
    userId: string,
    input: { departmentId?: string; isActive?: boolean; name?: string; systemRole?: 'admin' | 'user' },
  ): Promise<void> {
    const response = await fetch(createApiUrl(`/auth/governance/users/${userId}`), {
      body: JSON.stringify(input),
      headers: createJsonHeaders(),
      method: 'PATCH',
    });
    if (!response.ok) throw await readApiError(response);
  },
};
