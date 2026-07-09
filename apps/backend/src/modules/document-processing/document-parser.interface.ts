import type { DocumentType } from '../document';

export interface DocumentParserContext {
  documentId: string;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  title: string;
  type: DocumentType;
}

export interface DocumentParser {
  supports(type: DocumentType): boolean;
  parse(buffer: Buffer, context: DocumentParserContext): Promise<string>;
}
