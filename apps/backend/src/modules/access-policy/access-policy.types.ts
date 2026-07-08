export type AccessPolicySecurityLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
export type AccessPolicySpaceRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface AccessPolicySubject {
  departmentId?: string;
  permissions: string[];
  roles: string[];
  tenantId?: string;
  userId: string;
}

export interface KnowledgeResourceAccess {
  allowedDepartmentIds?: string[];
  departmentId?: string | null;
  securityLevel?: AccessPolicySecurityLevel | string;
  spaceId: string;
  spaceRole?: AccessPolicySpaceRole | null;
  tenantId?: string | null;
}

export interface AccessPolicyDecision {
  allowed: boolean;
  reason?: string;
}

export interface AccessPolicyFilterContext {
  documentMetadataById?: Record<string, KnowledgeResourceMetadata | undefined>;
  spaceRolesById: Record<string, AccessPolicySpaceRole | undefined>;
  spaceTenantIdsById?: Record<string, string | null | undefined>;
}

export interface KnowledgeResourceMetadata {
  allowedDepartmentIds?: string[];
  departmentId?: string | null;
  securityLevel?: AccessPolicySecurityLevel | string;
  spaceId?: string;
}

export interface AccessControlledRetrievalResult {
  documentId: string;
  metadata: KnowledgeResourceMetadata;
}

export interface AccessControlledGraphContext {
  documentId: string;
  allowedDepartmentIds?: string[];
  departmentId?: string | null;
  securityLevel?: AccessPolicySecurityLevel | string;
  spaceId?: string;
}
