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

export interface GraphNode {
  documentId: string;
  id: string;
  name: string;
  spaceId: string;
  type: string;
}

export interface GraphEdge {
  documentId: string;
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
}

export interface GraphView {
  counts: {
    edges: number;
    nodes: number;
  };
  edges: GraphEdge[];
  generatedAt: string;
  nodes: GraphNode[];
  source: 'document' | 'space';
}

export interface GraphContext {
  allowedDepartmentIds?: string[];
  content: string;
  departmentId?: string | null;
  documentId: string;
  securityLevel?: string;
  score: number;
  spaceId?: string;
  source: string;
  target: string;
  type: string;
}

export interface GraphExtractionResult {
  documentId: string;
  entityCount: number;
  relationCount: number;
}

export interface GraphDocumentCounts {
  documentId: string;
  entityCount: number;
  relationCount: number;
}

export interface GraphProvider {
  extractEntities(content: string): Promise<ExtractedEntity[]>;
  extractRelations(content: string, entities: ExtractedEntity[]): Promise<ExtractedRelation[]>;
}
