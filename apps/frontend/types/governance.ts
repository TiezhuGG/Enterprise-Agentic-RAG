import type { KnowledgeSpaceType, SpaceMemberRole } from '@/types/workbench';

export interface AuthorizationAuditRole {
  code: string;
  description: string | null;
  isSystem: boolean;
  name: string;
  permissions: string[];
}

export interface AuthorizationAuditUser {
  createdAt: string;
  department: AuthorizationEnterpriseUnit | null;
  email: string;
  id: string;
  isActive: boolean;
  name: string | null;
  organization: AuthorizationEnterpriseUnit | null;
  roles: AuthorizationAuditRole[];
  spaceMemberships: AuthorizationSpaceMembership[];
  tenant: AuthorizationEnterpriseUnit | null;
  updatedAt: string;
}

export interface AuthorizationEnterpriseUnit {
  code: string;
  id: string;
  name: string;
}

export interface AuthorizationSpaceMembership {
  role: SpaceMemberRole;
  space: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    type: KnowledgeSpaceType;
  };
}
