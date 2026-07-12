export const graphEntityCategories = [
  'ORGANIZATION',
  'ROLE',
  'POSITION',
  'PROCESS',
  'POLICY',
  'RULE',
  'REQUIREMENT',
  'BENEFIT',
  'DATA',
  'OTHER',
] as const;

export type GraphEntityCategory = (typeof graphEntityCategories)[number];

export const graphRelationCategories = [
  'OWNERSHIP',
  'CONTAINS',
  'APPROVAL',
  'REFERENCE',
  'REQUIREMENT',
  'APPLIES_TO',
  'PRECEDES',
  'RELATED',
] as const;

export type GraphRelationCategory = (typeof graphRelationCategories)[number];

export interface ExtractedEntity {
  category?: GraphEntityCategory;
  name: string;
  type: string;
}

export interface ExtractedRelation {
  evidence?: string;
  subject: string;
  predicate: string;
  object: string;
  relationCategory?: GraphRelationCategory;
}

export interface GraphEntity extends ExtractedEntity {
  category: GraphEntityCategory;
  displayType: string;
  id: string;
  documentId: string;
  spaceId: string;
}

export interface GraphRelation {
  documentId: string;
  displayLabel: string;
  evidence?: string;
  relationCategory: GraphRelationCategory;
  source: string;
  sourceChunkId?: string;
  sourceId: string;
  target: string;
  targetId: string;
  type: string;
}

export interface GraphNode {
  category: GraphEntityCategory;
  displayType: string;
  documentId: string;
  id: string;
  name: string;
  spaceId: string;
  type: string;
}

export interface GraphEdge {
  displayLabel: string;
  documentTitle: string | null;
  evidence: string | null;
  documentId: string;
  id: string;
  relationCategory: GraphRelationCategory;
  sourceChunkId: string | null;
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
  path: GraphPath;
  securityLevel?: string;
  score: number;
  spaceId?: string;
  source: string;
  target: string;
  type: string;
}

export interface GraphPathNode {
  id: string;
  name: string;
  type: string;
}

export interface GraphPathRelation {
  type: string;
}

export interface GraphPath {
  documentId: string;
  relation: GraphPathRelation;
  source: GraphPathNode;
  spaceId: string;
  target: GraphPathNode;
}

export interface GraphExtractionResult {
  documentId: string;
  chunkCount: number;
  entityCount: number;
  entityTypeDistribution: Record<string, number>;
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
