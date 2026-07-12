export type EnterpriseStatus = 'ACTIVE' | 'DISABLED';

export interface EnterpriseUnit {
  code: string;
  id: string;
  name: string;
}

export interface EnterpriseTenant extends EnterpriseUnit {
  status: EnterpriseStatus;
}

export interface EnterpriseDepartment extends EnterpriseUnit {
  knowledgeBaseCount: number;
  organizationId: string;
  parentId: string | null;
  status: EnterpriseStatus;
  userCount: number;
}

export interface EnterpriseDepartmentOption extends EnterpriseUnit {
  organizationId: string;
  parentId: string | null;
  status: EnterpriseStatus;
}

export interface EnterpriseOrganization extends EnterpriseUnit {
  departments: EnterpriseDepartment[];
  status: EnterpriseStatus;
}

export interface EnterpriseStructure {
  organizations: EnterpriseOrganization[];
  tenant: EnterpriseTenant | null;
}
