export interface ChunkMetadata extends Record<string, string | number> {
  documentId: string;
  sequence: number;
  sectionTitle: string;
  spaceId: string;
  documentType: string;
  language: string;
  securityLevel: string;
  sourceHash: string;
  contentHash: string;
}

export interface ChunkEntity {
  id: string;
  documentId: string;
  content: string;
  sequence: number;
  tokenCount: number;
  metadata: ChunkMetadata;
  createdAt: Date;
  updatedAt: Date;
}
