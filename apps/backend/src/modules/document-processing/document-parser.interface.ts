import type { DocumentType } from '../document';

export interface DocumentParser {
  supports(type: DocumentType): boolean;
  parse(buffer: Buffer): Promise<string>;
}
