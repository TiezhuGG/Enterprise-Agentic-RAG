export interface ExtractedEntity {
  name: string;
  type: string;
}

export interface ExtractedRelation {
  subject: string;
  predicate: string;
  object: string;
}

export interface GraphEntity extends ExtractedEntity {
  id: string;
  documentId: string;
  spaceId: string;
}

export interface GraphRelation {
  documentId: string;
  source: string;
  sourceId: string;
  target: string;
  targetId: string;
  type: string;
}

export interface GraphContext {
  content: string;
  documentId: string;
  score: number;
  source: string;
  target: string;
  type: string;
}

export interface GraphExtractionResult {
  documentId: string;
  entityCount: number;
  relationCount: number;
}

export interface GraphProvider {
  extractEntities(content: string): Promise<ExtractedEntity[]>;
  extractRelations(content: string, entities: ExtractedEntity[]): Promise<ExtractedRelation[]>;
}
