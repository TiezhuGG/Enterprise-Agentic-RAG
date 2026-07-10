import type { DocumentType } from '../document';

export const maxUploadFileSizeBytes = 50 * 1024 * 1024;

export const allowedUploadMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/md',
  'application/markdown',
  'application/x-markdown',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export interface UploadedDocumentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const extensionDocumentTypeMap: Readonly<Record<string, DocumentType>> = {
  '.pdf': 'PDF',
  '.doc': 'WORD',
  '.docx': 'WORD',
  '.txt': 'TXT',
  '.md': 'MARKDOWN',
  '.markdown': 'MARKDOWN',
  '.png': 'IMAGE',
  '.jpg': 'IMAGE',
  '.jpeg': 'IMAGE',
  '.webp': 'IMAGE',
  '.gif': 'IMAGE',
  '.mp3': 'AUDIO',
  '.wav': 'AUDIO',
  '.webm': 'AUDIO',
  '.m4a': 'AUDIO',
  '.ogg': 'AUDIO',
  '.mp4': 'VIDEO',
  '.mov': 'VIDEO',
};
