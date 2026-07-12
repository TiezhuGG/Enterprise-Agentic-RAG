'use client';

import { useEffect, useRef, useState } from 'react';
import cytoscape, { type Core, type StylesheetStyle } from 'cytoscape';
import { Expand, Focus, Maximize2, Minus, Plus, Shrink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GraphVisibleView } from '@/store/graph-browser.store';

const categoryColors: Record<string, { background: string; border: string; text: string }> = {
  BENEFIT: { background: '#ecfdf5', border: '#22c55e', text: '#166534' },
  DATA: { background: '#f0fdfa', border: '#14b8a6', text: '#115e59' },
  ORGANIZATION: { background: '#eff6ff', border: '#60a5fa', text: '#1d4ed8' },
  OTHER: { background: '#f8fafc', border: '#94a3b8', text: '#334155' },
  POLICY: { background: '#f0fdf4', border: '#4ade80', text: '#15803d' },
  POSITION: { background: '#f5f3ff', border: '#a78bfa', text: '#6d28d9' },
  PROCESS: { background: '#eef2ff', border: '#818cf8', text: '#4338ca' },
  REQUIREMENT: { background: '#fff1f2', border: '#fb7185', text: '#be123c' },
  ROLE: { background: '#faf5ff', border: '#c084fc', text: '#7e22ce' },
  RULE: { background: '#fffbeb', border: '#fbbf24', text: '#92400e' },
};

const relationColors: Record<string, string> = {
  APPLIES_TO: '#7c3aed',
  APPROVAL: '#d97706',
  CONTAINS: '#16a34a',
  OWNERSHIP: '#2563eb',
  PRECEDES: '#0891b2',
  REFERENCE: '#64748b',
  RELATED: '#94a3b8',
  REQUIREMENT: '#e11d48',
};

const graphStyles: StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(background)',
      'border-color': 'data(border)',
      'border-width': 1.5,
      color: 'data(textColor)',
      'font-family': 'Inter, "Microsoft YaHei", sans-serif',
      'font-size': 11,
      'font-weight': 600,
      height: 42,
      label: 'data(label)',
      'min-zoomed-font-size': 9,
      padding: '10px',
      shape: 'round-rectangle',
      'text-max-width': '118px',
      'text-wrap': 'ellipsis',
      'text-valign': 'center',
      width: 132,
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-color': '#2563eb',
      'border-width': 3,
      'overlay-color': '#dbeafe',
      'overlay-opacity': 0.35,
      'overlay-padding': 7,
    },
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      label: '',
      'line-color': 'data(color)',
      opacity: 0.68,
      'target-arrow-color': 'data(color)',
      'target-arrow-shape': 'triangle',
      width: 1.8,
    },
  },
  {
    selector: 'edge:selected, edge.is-hovered',
    style: {
      color: '#334155',
      'font-size': 10,
      'font-weight': 600,
      label: 'data(label)',
      'line-color': '#2563eb',
      opacity: 1,
      'source-text-offset': 10,
      'target-arrow-color': '#2563eb',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.94,
      'text-background-padding': '3px',
      'text-background-shape': 'roundrectangle',
      'text-rotation': 'autorotate',
      width: 3,
    },
  },
];

export function EnterpriseGraphCanvas({
  canExpand,
  onExpand,
  onSelectEdge,
  onSelectNode,
  selectedEdgeId,
  selectedNodeId,
  view,
}: {
  canExpand: boolean;
  onExpand: () => void;
  onSelectEdge: (edgeId: string | null) => void;
  onSelectNode: (nodeId: string | null) => void;
  selectedEdgeId: string | null;
  selectedNodeId: string | null;
  view: GraphVisibleView;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<Core | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = [
      ...view.nodes.map((node) => {
        const colors = categoryColors[node.category] ?? categoryColors.OTHER;
        return {
          data: {
            background: colors.background,
            border: colors.border,
            id: node.id,
            label: node.name,
            textColor: colors.text,
          },
        };
      }),
      ...view.edges.map((edge) => ({
        data: {
          color: relationColors[edge.relationCategory] ?? relationColors.RELATED,
          id: edge.id,
          label: edge.displayLabel,
          source: edge.sourceId,
          target: edge.targetId,
        },
      })),
    ];
    const core = cytoscape({
      container: containerRef.current,
      elements,
      layout: {
        animate: false,
        idealEdgeLength: 120,
        name: 'cose',
        nodeOverlap: 18,
        nodeRepulsion: 520000,
        padding: 40,
        randomize: false,
      },
      minZoom: 0.35,
      maxZoom: 2.2,
      style: graphStyles,
      wheelSensitivity: 0.18,
    });

    core.on('tap', 'node', (event) => onSelectNode(event.target.id()));
    core.on('tap', 'edge', (event) => onSelectEdge(event.target.id()));
    core.on('tap', (event) => {
      if (event.target === core) {
        onSelectEdge(null);
        onSelectNode(null);
      }
    });
    core.on('mouseover', 'edge', (event) => event.target.addClass('is-hovered'));
    core.on('mouseout', 'edge', (event) => event.target.removeClass('is-hovered'));

    if (selectedNodeId) core.getElementById(selectedNodeId).select();
    if (selectedEdgeId) core.getElementById(selectedEdgeId).select();

    coreRef.current = core;
    const resizeObserver = new ResizeObserver(() => {
      core.resize();
      core.fit(undefined, 36);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      core.destroy();
      coreRef.current = null;
    };
  }, [onSelectEdge, onSelectNode, selectedEdgeId, selectedNodeId, view]);

  return (
    <div
      className={fullscreen ? 'enterprise-graph enterprise-graph--fullscreen' : 'enterprise-graph'}
    >
      <div className="enterprise-graph__toolbar">
        <Button
          onClick={() => coreRef.current?.zoom(coreRef.current.zoom() * 1.18)}
          size="icon"
          title="放大"
          variant="outline"
        >
          <Plus />
        </Button>
        <Button
          onClick={() => coreRef.current?.zoom(coreRef.current.zoom() / 1.18)}
          size="icon"
          title="缩小"
          variant="outline"
        >
          <Minus />
        </Button>
        <Button
          onClick={() => coreRef.current?.fit(undefined, 36)}
          size="icon"
          title="适应画布"
          variant="outline"
        >
          <Focus />
        </Button>
        <Button
          onClick={() =>
            coreRef.current
              ?.layout({ animate: false, name: 'cose', padding: 40, randomize: true })
              .run()
          }
          size="icon"
          title="重新布局"
          variant="outline"
        >
          <Maximize2 />
        </Button>
        {canExpand ? (
          <Button onClick={onExpand} variant="outline">
            <Expand />
            继续展开
          </Button>
        ) : null}
        <Button
          onClick={() => setFullscreen((value) => !value)}
          size="icon"
          title={fullscreen ? '退出全屏' : '全屏查看'}
          variant="outline"
        >
          {fullscreen ? <Shrink /> : <Expand />}
        </Button>
      </div>
      <div className="enterprise-graph__canvas" ref={containerRef} />
    </div>
  );
}
