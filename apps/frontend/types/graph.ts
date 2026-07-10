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

export type GraphBrowserScope = 'space' | 'document';
export type GraphHopDepth = 1 | 2;
