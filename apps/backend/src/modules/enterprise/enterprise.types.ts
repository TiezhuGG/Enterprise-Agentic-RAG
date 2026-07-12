export const enterpriseStatuses = ['ACTIVE', 'DISABLED'] as const;
export type EnterpriseStatus = (typeof enterpriseStatuses)[number];

export interface EnterpriseSummary {
  code: string;
  id: string;
  name: string;
}

export interface TenantEntity extends EnterpriseSummary {
  createdAt: Date;
  metadata: Record<string, unknown>;
  status: EnterpriseStatus;
  updatedAt: Date;
}

export interface OrganizationEntity extends EnterpriseSummary {
  createdAt: Date;
  metadata: Record<string, unknown>;
  status: EnterpriseStatus;
  tenantId: string;
  updatedAt: Date;
}

export interface DepartmentEntity extends EnterpriseSummary {
  createdAt: Date;
  metadata: Record<string, unknown>;
  organizationId: string;
  parentId: string | null;
  status: EnterpriseStatus;
  tenantId: string;
  updatedAt: Date;
}

export interface GovernedDepartmentEntity extends DepartmentEntity {
  knowledgeBaseCount: number;
  userCount: number;
}

export interface GovernedOrganizationEntity extends OrganizationEntity {
  departments: GovernedDepartmentEntity[];
}

export interface EnterpriseStructureEntity {
  organizations: GovernedOrganizationEntity[];
  tenant: TenantEntity | null;
}

export interface EnterpriseContextEntity {
  department: DepartmentEntity | null;
  organization: OrganizationEntity | null;
  tenant: TenantEntity | null;
}

export interface UpsertTenantInput {
  code: string;
  metadata?: Record<string, unknown>;
  name: string;
  status?: EnterpriseStatus;
}

export interface UpsertOrganizationInput {
  code: string;
  metadata?: Record<string, unknown>;
  name: string;
  status?: EnterpriseStatus;
  tenantId: string;
}

export interface UpsertDepartmentInput {
  code: string;
  metadata?: Record<string, unknown>;
  name: string;
  organizationId: string;
  parentId?: string;
  status?: EnterpriseStatus;
  tenantId: string;
}

export interface AssignUserEnterpriseInput {
  departmentId?: string;
  organizationId?: string;
  tenantId?: string;
}

export interface CreateOrganizationInput {
  name: string;
  tenantId: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  status?: EnterpriseStatus;
}

export interface CreateDepartmentInput {
  name: string;
  organizationId: string;
  parentId?: string;
  tenantId: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  parentId?: string | null;
  status?: EnterpriseStatus;
}
