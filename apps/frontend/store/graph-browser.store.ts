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
  focusLimit: number;
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
  expandFocus: () => void;
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
  displayMode: 'document' | 'empty' | 'filtered' | 'focus' | 'overview' | 'query';
  hiddenCounts: {
    edges: number;
    nodes: number;
  };
  selectedEdge: GraphEdge | null;
  selectedNode: GraphNode | null;
  totalCounts: GraphView['counts'];
  typeOptions: string[];
}

type GraphVisibleViewInput = Pick<
  GraphBrowserState,
  | 'focusLimit'
  | 'hopDepth'
  | 'selectedEdgeId'
  | 'selectedNodeId'
  | 'submittedQuery'
  | 'typeFilter'
  | 'view'
>;

const graphLimit = 160;
const documentOverviewLimit = 28;
const spaceOverviewLimit = 18;
const initialFocusLimit = 13;

export const useGraphBrowserStore = create<GraphBrowserState>((set, get) => ({
  error: null,
  focusLimit: initialFocusLimit,
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
      focusLimit: initialFocusLimit,
      selectedEdgeId: null,
      selectedNodeId: null,
    });
  },

  expandFocus() {
    set((state) => ({ focusLimit: Math.min(state.focusLimit + 12, 49) }));
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
        error: toUserFacingErrorMessage(error, '图谱加载失败，请稍后重试。'),
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
      focusLimit: initialFocusLimit,
      selectedEdgeId: null,
      selectedNodeId: nodeId,
    });
  },

  setHopDepth(hopDepth) {
    set({ focusLimit: initialFocusLimit, hopDepth });
  },

  setQuery(query) {
    set({ query });
  },

  setScope(scope) {
    set({
      focusLimit: initialFocusLimit,
      scope,
      selectedEdgeId: null,
      selectedNodeId: null,
      submittedQuery: scope === 'document' ? '' : get().submittedQuery,
      view: null,
    });
  },

  setTypeFilter(typeFilter) {
    set({
      focusLimit: initialFocusLimit,
      selectedEdgeId: null,
      selectedNodeId: null,
      typeFilter,
    });
  },

  async submitQuery() {
    set((state) => ({
      focusLimit: initialFocusLimit,
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

  const typeOptions = [...new Set(state.view.nodes.map((node) => node.category))].sort();
  const normalizedQuery = state.submittedQuery.trim().toLowerCase();
  const queryMatchedNodeIds = normalizedQuery
    ? collectQueryMatchedNodeIds(state.view.nodes, state.view.edges, normalizedQuery)
    : null;
  const typeFilteredNodes =
    state.typeFilter === 'ALL'
      ? state.view.nodes
      : state.view.nodes.filter((node) => node.category === state.typeFilter);
  const typeFilteredNodeIds = new Set(typeFilteredNodes.map((node) => node.id));
  const selectedNode = state.selectedNodeId
    ? (state.view.nodes.find((node) => node.id === state.selectedNodeId) ?? null)
    : null;
  const selectedNodeIds = selectedNode
    ? collectNeighborNodeIds(state.view.edges, selectedNode.id, state.hopDepth)
    : null;
  const { displayMode, visibleNodeIds } = resolveVisibleNodeIds({
    focusLimit: state.focusLimit,
    queryMatchedNodeIds,
    selectedNodeIds,
    selectedNodeId: selectedNode?.id ?? null,
    typeFilteredNodeIds,
    view: state.view,
  });
  const orderedVisibleNodes = orderVisibleNodes({
    edges: state.view.edges,
    nodes: state.view.nodes.filter((node) => visibleNodeIds.has(node.id)),
    queryMatchedNodeIds,
    selectedNodeId: selectedNode?.id ?? null,
  });
  const visibleEdges = state.view.edges.filter(
    (edge) => visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId),
  );
  const selectedEdge = state.selectedEdgeId
    ? (state.view.edges.find((edge) => edge.id === state.selectedEdgeId) ?? null)
    : null;

  return {
    ...state.view,
    counts: {
      edges: visibleEdges.length,
      nodes: orderedVisibleNodes.length,
    },
    displayMode,
    edges: visibleEdges,
    hiddenCounts: {
      edges: Math.max(0, state.view.counts.edges - visibleEdges.length),
      nodes: Math.max(0, state.view.counts.nodes - orderedVisibleNodes.length),
    },
    nodes: orderedVisibleNodes,
    selectedEdge,
    selectedNode,
    totalCounts: state.view.counts,
    typeOptions,
  };
};

const resolveVisibleNodeIds = ({
  focusLimit,
  queryMatchedNodeIds,
  selectedNodeIds,
  selectedNodeId,
  typeFilteredNodeIds,
  view,
}: {
  focusLimit: number;
  queryMatchedNodeIds: Set<string> | null;
  selectedNodeIds: Set<string> | null;
  selectedNodeId: string | null;
  typeFilteredNodeIds: Set<string>;
  view: GraphView;
}): Pick<GraphVisibleView, 'displayMode'> & { visibleNodeIds: Set<string> } => {
  if (selectedNodeIds) {
    const filteredNodeIds = new Set(
      [...selectedNodeIds].filter((nodeId) => typeFilteredNodeIds.has(nodeId)),
    );
    return {
      displayMode: 'focus',
      visibleNodeIds: selectFocusNodeIds(filteredNodeIds, view.edges, selectedNodeId, focusLimit),
    };
  }

  if (queryMatchedNodeIds) {
    const expandedQueryNodeIds = expandNodeIdsByDepth(view.edges, queryMatchedNodeIds, 1);

    return {
      displayMode: 'query',
      visibleNodeIds: new Set(
        [...expandedQueryNodeIds].filter((nodeId) => typeFilteredNodeIds.has(nodeId)),
      ),
    };
  }

  const typeFilteredNodes = view.nodes.filter((node) => typeFilteredNodeIds.has(node.id));
  const overviewLimit = view.source === 'document' ? documentOverviewLimit : spaceOverviewLimit;

  if (typeFilteredNodes.length === 0) {
    return {
      displayMode: 'empty',
      visibleNodeIds: new Set(),
    };
  }

  if (typeFilteredNodes.length <= overviewLimit) {
    return {
      displayMode: view.source === 'document' ? 'document' : 'filtered',
      visibleNodeIds: typeFilteredNodeIds,
    };
  }

  return {
    displayMode: 'overview',
    visibleNodeIds: selectHubNodeIds(typeFilteredNodes, view.edges, overviewLimit),
  };
};

const orderVisibleNodes = ({
  edges,
  nodes,
  queryMatchedNodeIds,
  selectedNodeId,
}: {
  edges: GraphEdge[];
  nodes: GraphNode[];
  queryMatchedNodeIds: Set<string> | null;
  selectedNodeId: string | null;
}): GraphNode[] => {
  const degrees = getNodeDegrees(edges);

  return [...nodes].sort((left, right) => {
    if (selectedNodeId) {
      if (left.id === selectedNodeId) {
        return -1;
      }

      if (right.id === selectedNodeId) {
        return 1;
      }
    }

    if (queryMatchedNodeIds) {
      const leftMatched = queryMatchedNodeIds.has(left.id);
      const rightMatched = queryMatchedNodeIds.has(right.id);

      if (leftMatched !== rightMatched) {
        return leftMatched ? -1 : 1;
      }
    }

    const degreeDelta = (degrees.get(right.id) ?? 0) - (degrees.get(left.id) ?? 0);

    if (degreeDelta !== 0) {
      return degreeDelta;
    }

    return left.name.localeCompare(right.name);
  });
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
          node.type.toLowerCase().includes(normalizedQuery) ||
          node.displayType.toLowerCase().includes(normalizedQuery) ||
          node.category.toLowerCase().includes(normalizedQuery),
      )
      .map((node) => node.id),
  );

  edges.forEach((edge) => {
    if (
      edge.type.toLowerCase().includes(normalizedQuery) ||
      edge.displayLabel.toLowerCase().includes(normalizedQuery) ||
      edge.evidence?.toLowerCase().includes(normalizedQuery)
    ) {
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

const expandNodeIdsByDepth = (
  edges: GraphEdge[],
  nodeIds: Set<string>,
  depth: GraphHopDepth,
): Set<string> => {
  const expandedNodeIds = new Set<string>();

  nodeIds.forEach((nodeId) => {
    collectNeighborNodeIds(edges, nodeId, depth).forEach((value) => expandedNodeIds.add(value));
  });

  return expandedNodeIds;
};

const selectHubNodeIds = (nodes: GraphNode[], edges: GraphEdge[], limit: number): Set<string> => {
  const degrees = getNodeDegrees(edges);

  return new Set(
    [...nodes]
      .sort((left, right) => {
        const degreeDelta = (degrees.get(right.id) ?? 0) - (degrees.get(left.id) ?? 0);

        if (degreeDelta !== 0) {
          return degreeDelta;
        }

        return left.name.localeCompare(right.name);
      })
      .slice(0, limit)
      .map((node) => node.id),
  );
};

const selectFocusNodeIds = (
  nodeIds: Set<string>,
  edges: GraphEdge[],
  selectedNodeId: string | null,
  limit: number,
): Set<string> => {
  const degrees = getNodeDegrees(edges);
  const ordered = [...nodeIds].sort((left, right) => {
    if (left === selectedNodeId) return -1;
    if (right === selectedNodeId) return 1;
    return (degrees.get(right) ?? 0) - (degrees.get(left) ?? 0);
  });

  return new Set(ordered.slice(0, limit));
};

const getNodeDegrees = (edges: GraphEdge[]): Map<string, number> => {
  const degrees = new Map<string, number>();

  edges.forEach((edge) => {
    degrees.set(edge.sourceId, (degrees.get(edge.sourceId) ?? 0) + 1);
    degrees.set(edge.targetId, (degrees.get(edge.targetId) ?? 0) + 1);
  });

  return degrees;
};
