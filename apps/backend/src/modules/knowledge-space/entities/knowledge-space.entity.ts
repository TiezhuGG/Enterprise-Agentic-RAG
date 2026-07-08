export const knowledgeSpaceVisibilities = ['PRIVATE', 'INTERNAL', 'PUBLIC'] as const;
export type KnowledgeSpaceVisibility = (typeof knowledgeSpaceVisibilities)[number];

export const knowledgeSpaceStatuses = ['ACTIVE', 'ARCHIVED', 'DELETED'] as const;
export type KnowledgeSpaceStatus = (typeof knowledgeSpaceStatuses)[number];

export const spaceMemberRoles = ['OWNER', 'EDITOR', 'VIEWER'] as const;
export type SpaceMemberRole = (typeof spaceMemberRoles)[number];

export interface SpaceMemberEntity {
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
}

export interface KnowledgeSpaceEntity {
  id: string;
  name: string;
  description: string | null;
  visibility: KnowledgeSpaceVisibility;
  status: KnowledgeSpaceStatus;
  ownerId: string;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: SpaceMemberEntity[];
}
