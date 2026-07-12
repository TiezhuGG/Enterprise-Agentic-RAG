import type { AuthorizationAuditRole, AuthorizationAuditUser } from '@/types/governance';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const authorizationAuditService = {
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
};
