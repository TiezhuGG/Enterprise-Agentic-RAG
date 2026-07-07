export const defaultChunkSizeTokens = 500;
export const defaultChunkOverlapTokens = 100;
export const defaultSectionTitle = 'Document';

export interface MarkdownSection {
  sectionTitle: string;
  content: string;
}

export interface TokenSplitChunk {
  sectionTitle: string;
  content: string;
  tokenCount: number;
}

export interface ChunkOptions {
  chunkSize: number;
  overlap: number;
}
