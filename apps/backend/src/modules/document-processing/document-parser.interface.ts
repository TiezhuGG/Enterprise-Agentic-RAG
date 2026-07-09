import type { DocumentType } from '../document';

export interface DocumentParserContext {
  documentId: string;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  title: string;
  type: DocumentType;
}

export interface DocumentParsingResult {
  content: string;
  metadata?: Record<string, unknown>;
}

export type DocumentParserOutput = string | DocumentParsingResult;

export interface DocumentParser {
  supports(type: DocumentType): boolean;
  parse(buffer: Buffer, context: DocumentParserContext): Promise<DocumentParserOutput>;
}
