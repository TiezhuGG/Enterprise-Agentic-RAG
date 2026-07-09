export const multimodalAttachmentTypes = ['IMAGE', 'AUDIO', 'VIDEO'] as const;
export type MultimodalAttachmentType = (typeof multimodalAttachmentTypes)[number];

export const multimodalAttachmentStatuses = ['CREATED', 'EXTRACTED', 'FAILED'] as const;
export type MultimodalAttachmentStatus = (typeof multimodalAttachmentStatuses)[number];

export type MultimodalModality = 'image' | 'audio' | 'video';

export interface MultimodalExtractionMetadata {
  provider: string;
  modality: MultimodalModality;
  processedAt: string;
  filename?: string;
  mimeType?: string;
  model?: string;
  language?: string;
  confidence?: number;
  size?: number;
  timelineCount?: number;
  [key: string]: unknown;
}

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
  metadata: MultimodalExtractionMetadata;
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
