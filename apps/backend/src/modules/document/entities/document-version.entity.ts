import type { DocumentStatus, DocumentType } from './document.entity';

export interface DocumentVersionEntity {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  description: string | null;
  type: DocumentType;
  status: DocumentStatus;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  sourceHash: string | null;
  contentHash: string | null;
  isCurrent: boolean;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const normalizeDocumentVersionMetadata = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};
