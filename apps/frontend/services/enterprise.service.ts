import { createApiUrl, createJsonHeaders, readApiError } from './api-client';
import type { EnterpriseDepartment, EnterpriseDepartmentOption, EnterpriseDisableCheck, EnterpriseOrganization, EnterpriseStructure } from '@/types/enterprise';

const request = async <T>(path: string, method: 'GET' | 'PATCH' | 'POST', body?: unknown): Promise<T> => {
  const response = await fetch(createApiUrl(path), {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: createJsonHeaders(),
    method,
  });
  if (!response.ok) throw await readApiError(response);
  return (await response.json()) as T;
};

export const enterpriseService = {
  createDepartment(input: { name: string; organizationId: string; parentId?: string }): Promise<EnterpriseDepartment> {
    return request('/enterprise/departments', 'POST', input);
  },
  createOrganization(input: { name: string }): Promise<EnterpriseOrganization> {
    return request('/enterprise/organizations', 'POST', input);
  },
  getDepartmentDisableCheck(id: string): Promise<EnterpriseDisableCheck> {
    return request(`/enterprise/departments/${id}/disable-check`, 'GET');
  },
  getOrganizationDisableCheck(id: string): Promise<EnterpriseDisableCheck> {
    return request(`/enterprise/organizations/${id}/disable-check`, 'GET');
  },
  getStructure(): Promise<EnterpriseStructure> {
    return request('/enterprise/structure', 'GET');
  },
  listDepartments(): Promise<EnterpriseDepartmentOption[]> {
    return request('/enterprise/departments', 'GET');
  },
  updateDepartment(id: string, input: { name?: string; parentId?: string | null; status?: 'ACTIVE' | 'DISABLED' }): Promise<EnterpriseDepartment> {
    return request(`/enterprise/departments/${id}`, 'PATCH', input);
  },
  updateOrganization(id: string, input: { name?: string; status?: 'ACTIVE' | 'DISABLED' }): Promise<EnterpriseOrganization> {
    return request(`/enterprise/organizations/${id}`, 'PATCH', input);
  },
};
