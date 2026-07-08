export type MultimodalAttachmentType = 'IMAGE' | 'AUDIO';
export type MultimodalAttachmentStatus = 'EXTRACTED' | 'FAILED';

export interface MultimodalAttachment {
  id: string;
  type: MultimodalAttachmentType;
  status: MultimodalAttachmentStatus;
  filename: string;
  mimeType: string;
  size: number;
  extractedText: string;
  createdAt: string;
}
