export const multimodalAttachmentTypes = ['IMAGE', 'AUDIO'] as const;
export type MultimodalAttachmentType = (typeof multimodalAttachmentTypes)[number];

export const multimodalAttachmentStatuses = ['CREATED', 'EXTRACTED', 'FAILED'] as const;
export type MultimodalAttachmentStatus = (typeof multimodalAttachmentStatuses)[number];

export interface UploadedMultimodalFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface MultimodalAttachmentEntity {
  id: string;
  userId: string;
  conversationId: string | null;
  type: MultimodalAttachmentType;
  status: MultimodalAttachmentStatus;
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  extractedText: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultimodalAttachmentResponse {
  id: string;
  type: MultimodalAttachmentType;
  status: Extract<MultimodalAttachmentStatus, 'EXTRACTED' | 'FAILED'>;
  filename: string;
  mimeType: string;
  size: number;
  extractedText: string;
  createdAt: Date;
}

export interface MultimodalContext {
  attachmentId: string;
  type: MultimodalAttachmentType;
  filename: string;
  mimeType: string;
  content: string;
}
