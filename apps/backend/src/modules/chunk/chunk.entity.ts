export interface ChunkMetadata extends Record<string, string | number> {
  documentId: string;
  sequence: number;
  sectionTitle: string;
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
