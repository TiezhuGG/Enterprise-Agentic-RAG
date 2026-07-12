export const knowledgeSpaceVisibilities = ['PRIVATE', 'INTERNAL', 'PUBLIC'] as const;
export type KnowledgeSpaceVisibility = (typeof knowledgeSpaceVisibilities)[number];

export const knowledgeSpaceStatuses = ['ACTIVE', 'ARCHIVED', 'DELETED'] as const;
export type KnowledgeSpaceStatus = (typeof knowledgeSpaceStatuses)[number];

export const knowledgeSpaceTypes = ['GENERAL', 'DEPARTMENT', 'PROJECT', 'CUSTOMER'] as const;
export type KnowledgeSpaceType = (typeof knowledgeSpaceTypes)[number];

export interface KnowledgeSpaceMetadata extends Record<string, unknown> {
  customerCode?: string;
  customerName?: string;
  projectCode?: string;
  projectName?: string;
}

export interface KnowledgeSpaceDepartmentEntity {
  code: string;
  id: string;
  name: string;
  organizationId: string;
  parentId: string | null;
}

export const spaceMemberRoles = ['OWNER', 'EDITOR', 'VIEWER'] as const;
export type SpaceMemberRole = (typeof spaceMemberRoles)[number];

export interface SpaceMemberEntity {
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
}

export interface SpaceMemberUserEntity {
  departmentId: string | null;
  email: string;
  id: string;
  name: string | null;
  organizationId: string | null;
  tenantId: string | null;
}

export interface SpaceMemberDetailEntity extends SpaceMemberEntity {
  user: SpaceMemberUserEntity;
}

export interface KnowledgeSpaceEntity {
  id: string;
  name: string;
  description: string | null;
  visibility: KnowledgeSpaceVisibility;
  type: KnowledgeSpaceType;
  status: KnowledgeSpaceStatus;
  ownerId: string;
  tenantId: string | null;
  departmentId: string | null;
  department: KnowledgeSpaceDepartmentEntity | null;
  metadata: KnowledgeSpaceMetadata;
  createdAt: Date;
  updatedAt: Date;
  members: SpaceMemberEntity[];
  documentCount: number;
  memberCount: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const normalizeKnowledgeSpaceMetadata = (value: unknown): KnowledgeSpaceMetadata => {
  const candidate = isRecord(value) ? value : {};
  const metadata: KnowledgeSpaceMetadata = {};
  const customerCode = toOptionalString(candidate.customerCode);
  const customerName = toOptionalString(candidate.customerName);
  const projectCode = toOptionalString(candidate.projectCode);
  const projectName = toOptionalString(candidate.projectName);

  if (customerCode) {
    metadata.customerCode = customerCode;
  }

  if (customerName) {
    metadata.customerName = customerName;
  }

  if (projectCode) {
    metadata.projectCode = projectCode;
  }

  if (projectName) {
    metadata.projectName = projectName;
  }

  return metadata;
};
