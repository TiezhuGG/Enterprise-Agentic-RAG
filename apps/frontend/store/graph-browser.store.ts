'use client';

import { create } from 'zustand';
import { toUserFacingErrorMessage } from '@/lib/workbench-copy';
import { graphService } from '@/services/graph.service';
import type {
  GraphBrowserScope,
  GraphEdge,
  GraphHopDepth,
  GraphNode,
  GraphView,
} from '@/types/graph';
import { useWorkbenchStore } from './workbench.store';

interface GraphBrowserState {
  error: string | null;
  hopDepth: GraphHopDepth;
  loading: boolean;
  query: string;
  scope: GraphBrowserScope;
  selectedEdgeId: string | null;
  selectedNodeId: string | null;
  submittedQuery: string;
  typeFilter: string;
  view: GraphView | null;
  clearSelection: () => void;
  loadGraph: () => Promise<void>;
  selectEdge: (edgeId: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  setHopDepth: (hopDepth: GraphHopDepth) => void;
  setQuery: (query: string) => void;
  setScope: (scope: GraphBrowserScope) => void;
  setTypeFilter: (typeFilter: string) => void;
  submitQuery: () => Promise<void>;
}

export interface GraphVisibleView extends GraphView {
  selectedEdge: GraphEdge | null;
  selectedNode: GraphNode | null;
  typeOptions: string[];
}

type GraphVisibleViewInput = Pick<
  GraphBrowserState,
  'hopDepth' | 'selectedEdgeId' | 'selectedNodeId' | 'submittedQuery' | 'typeFilter' | 'view'
>;

const graphLimit = 160;

export const useGraphBrowserStore = create<GraphBrowserState>((set, get) => ({
  error: null,
  hopDepth: 1,
  loading: false,
  query: '',
  scope: 'space',
  selectedEdgeId: null,
  selectedNodeId: null,
  submittedQuery: '',
  typeFilter: 'ALL',
  view: null,

  clearSelection() {
    set({
      selectedEdgeId: null,
      selectedNodeId: null,
    });
  },

  async loadGraph() {
    const { scope, submittedQuery } = get();
    const { selectedDocumentId, selectedSpaceId } = useWorkbenchStore.getState();

    if (scope === 'document' && !selectedDocumentId) {
      set({ error: null, loading: false, view: null });
      return;
    }

    if (scope === 'space' && !selectedSpaceId) {
      set({ error: null, loading: false, view: null });
      return;
    }

    set({ error: null, loading: true });

    try {
      const view =
        scope === 'document' && selectedDocumentId
          ? await graphService.getDocumentGraph(selectedDocumentId)
          : await graphService.getSpaceGraph(selectedSpaceId as string, {
              limit: graphLimit,
              query: submittedQuery,
            });

      set((state) => ({
        error: null,
        loading: false,
        selectedEdgeId: state.selectedEdgeId
          ? view.edges.some((edge) => edge.id === state.selectedEdgeId)
            ? state.selectedEdgeId
            : null
          : null,
        selectedNodeId: state.selectedNodeId
          ? view.nodes.some((node) => node.id === state.selectedNodeId)
            ? state.selectedNodeId
            : null
          : null,
        view,
      }));
    } catch (error) {
      set({
        error: toUserFacingErrorMessage(error, 'Graph loading failed. Please try again.'),
        loading: false,
        view: null,
      });
    }
  },

  selectEdge(edgeId) {
    set({
      selectedEdgeId: edgeId,
    });
  },

  selectNode(nodeId) {
    set({
      selectedEdgeId: null,
      selectedNodeId: nodeId,
    });
  },

  setHopDepth(hopDepth) {
    set({ hopDepth });
  },

  setQuery(query) {
    set({ query });
  },

  setScope(scope) {
    set({
      scope,
      selectedEdgeId: null,
      selectedNodeId: null,
      submittedQuery: scope === 'document' ? '' : get().submittedQuery,
      view: null,
    });
  },

  setTypeFilter(typeFilter) {
    set({
      selectedEdgeId: null,
      selectedNodeId: null,
      typeFilter,
    });
  },

  async submitQuery() {
    set((state) => ({
      selectedEdgeId: null,
      selectedNodeId: null,
      submittedQuery: state.query.trim(),
    }));
    await get().loadGraph();
  },
}));

export const createGraphVisibleView = (state: GraphVisibleViewInput): GraphVisibleView | null => {
  if (!state.view) {
    return null;
  }

  const typeOptions = [
    ...new Set(state.view.nodes.map((node) => node.type).filter(Boolean)),
  ].sort();
  const normalizedQuery = state.submittedQuery.trim().toLowerCase();
  const queryMatchedNodeIds = normalizedQuery
    ? collectQueryMatchedNodeIds(state.view.nodes, state.view.edges, normalizedQuery)
    : null;
  const typeFilteredNodes =
    state.typeFilter === 'ALL'
      ? state.view.nodes
      : state.view.nodes.filter((node) => node.type === state.typeFilter);
  const typeFilteredNodeIds = new Set(typeFilteredNodes.map((node) => node.id));
  const selectedNode = state.selectedNodeId
    ? (state.view.nodes.find((node) => node.id === state.selectedNodeId) ?? null)
    : null;
  const selectedNodeIds = selectedNode
    ? collectNeighborNodeIds(state.view.edges, selectedNode.id, state.hopDepth)
    : null;
  const visibleNodeIds = selectedNodeIds
    ? new Set([...selectedNodeIds].filter((nodeId) => typeFilteredNodeIds.has(nodeId)))
    : typeFilteredNodeIds;
  const queryAndTypeNodeIds = queryMatchedNodeIds
    ? new Set([...visibleNodeIds].filter((nodeId) => queryMatchedNodeIds.has(nodeId)))
    : visibleNodeIds;
  const visibleNodes = state.view.nodes.filter((node) => queryAndTypeNodeIds.has(node.id));
  const visibleEdges = state.view.edges.filter(
    (edge) => queryAndTypeNodeIds.has(edge.sourceId) && queryAndTypeNodeIds.has(edge.targetId),
  );
  const selectedEdge = state.selectedEdgeId
    ? (state.view.edges.find((edge) => edge.id === state.selectedEdgeId) ?? null)
    : null;

  return {
    ...state.view,
    counts: {
      edges: visibleEdges.length,
      nodes: visibleNodes.length,
    },
    edges: visibleEdges,
    nodes: visibleNodes,
    selectedEdge,
    selectedNode,
    typeOptions,
  };
};

const collectQueryMatchedNodeIds = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  normalizedQuery: string,
): Set<string> => {
  const matchedNodeIds = new Set(
    nodes
      .filter(
        (node) =>
          node.name.toLowerCase().includes(normalizedQuery) ||
          node.type.toLowerCase().includes(normalizedQuery),
      )
      .map((node) => node.id),
  );

  edges.forEach((edge) => {
    if (edge.type.toLowerCase().includes(normalizedQuery)) {
      matchedNodeIds.add(edge.sourceId);
      matchedNodeIds.add(edge.targetId);
    }
  });

  return matchedNodeIds;
};

const collectNeighborNodeIds = (
  edges: GraphEdge[],
  nodeId: string,
  hopDepth: GraphHopDepth,
): Set<string> => {
  const visited = new Set<string>([nodeId]);
  let frontier = new Set<string>([nodeId]);

  for (let depth = 0; depth < hopDepth; depth += 1) {
    const nextFrontier = new Set<string>();

    for (const edge of edges) {
      if (frontier.has(edge.sourceId) && !visited.has(edge.targetId)) {
        nextFrontier.add(edge.targetId);
      }

      if (frontier.has(edge.targetId) && !visited.has(edge.sourceId)) {
        nextFrontier.add(edge.sourceId);
      }
    }

    nextFrontier.forEach((value) => visited.add(value));
    frontier = nextFrontier;
  }

  return visited;
};
