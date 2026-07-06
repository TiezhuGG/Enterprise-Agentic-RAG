export const documentTypes = ['PDF', 'WORD', 'TXT', 'MARKDOWN', 'IMAGE', 'AUDIO', 'VIDEO'] as const;
export type DocumentType = (typeof documentTypes)[number];

export const documentStatuses = ['CREATED', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED'] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export interface DocumentEntity {
  id: string;
  spaceId: string;
  title: string;
  description: string | null;
  type: DocumentType;
  status: DocumentStatus;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
