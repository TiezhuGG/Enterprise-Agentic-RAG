export const documentTypes = ['PDF', 'WORD', 'TXT', 'MARKDOWN', 'IMAGE', 'AUDIO', 'VIDEO'] as const;
export type DocumentType = (typeof documentTypes)[number];

export const documentStatuses = ['CREATED', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED'] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const documentAccessSecurityLevels = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'] as const;
export type DocumentAccessSecurityLevel = (typeof documentAccessSecurityLevels)[number];

export interface DocumentAccessScope extends Record<string, unknown> {
  allowedDepartmentIds?: string[];
  departmentId?: string;
  securityLevel: DocumentAccessSecurityLevel;
}

export interface DocumentEntity {
  id: string;
  spaceId: string;
  title: string;
  description: string | null;
  type: DocumentType;
  status: DocumentStatus;
  accessScope: DocumentAccessScope;
  categoryId: string | null;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ]
    : [];

export const normalizeDocumentAccessScope = (value: unknown): DocumentAccessScope => {
  const candidate = isRecord(value) ? value : {};
  const securityLevel = documentAccessSecurityLevels.includes(
    candidate.securityLevel as DocumentAccessSecurityLevel,
  )
    ? (candidate.securityLevel as DocumentAccessSecurityLevel)
    : 'INTERNAL';
  const departmentId = normalizeString(candidate.departmentId);
  const allowedDepartmentIds = normalizeStringArray(candidate.allowedDepartmentIds);
  const scope: DocumentAccessScope = {
    securityLevel,
  };

  if (departmentId) {
    scope.departmentId = departmentId;
  }

  if (allowedDepartmentIds.length > 0) {
    scope.allowedDepartmentIds = allowedDepartmentIds;
  }

  return scope;
};
