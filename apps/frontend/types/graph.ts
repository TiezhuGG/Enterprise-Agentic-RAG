export type GraphEntityCategory =
  | 'ORGANIZATION'
  | 'ROLE'
  | 'POSITION'
  | 'PROCESS'
  | 'POLICY'
  | 'RULE'
  | 'REQUIREMENT'
  | 'BENEFIT'
  | 'DATA'
  | 'OTHER';

export type GraphRelationCategory =
  | 'OWNERSHIP'
  | 'CONTAINS'
  | 'APPROVAL'
  | 'REFERENCE'
  | 'REQUIREMENT'
  | 'APPLIES_TO'
  | 'PRECEDES'
  | 'RELATED';

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

export type GraphBrowserScope = 'space' | 'document';
export type GraphHopDepth = 1 | 2;
