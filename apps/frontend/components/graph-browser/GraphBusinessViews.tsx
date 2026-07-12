'use client';

import { useState } from 'react';
import { ArrowRight, FileText, Network, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GraphEdge, GraphEntityCategory, GraphNode, GraphView } from '@/types/graph';
import { cn } from '@/lib/utils';

export const graphCategoryLabels: Record<GraphEntityCategory, string> = {
  BENEFIT: '福利',
  DATA: '数据',
  ORGANIZATION: '组织',
  OTHER: '其他',
  POLICY: '制度',
  POSITION: '岗位',
  PROCESS: '流程',
  REQUIREMENT: '要求',
  ROLE: '角色',
  RULE: '规则',
};

const categoryOrder: GraphEntityCategory[] = [
  'POSITION',
  'ROLE',
  'PROCESS',
  'POLICY',
  'RULE',
  'REQUIREMENT',
  'BENEFIT',
  'ORGANIZATION',
  'DATA',
  'OTHER',
];

export function GraphBusinessView({
  onOpenDocument,
  onSelectEdge,
  onSelectNode,
  selectedEdgeId,
  selectedNodeId,
  view,
}: {
  onOpenDocument: (documentId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  selectedEdgeId: string | null;
  selectedNodeId: string | null;
  view: GraphView;
}) {
  const nodesById = new Map(view.nodes.map((node) => [node.id, node]));
  const selectedNode = nodesById.get(selectedNodeId ?? '') ?? view.nodes[0] ?? null;
  const activeCategory = selectedNode?.category ?? view.nodes[0]?.category ?? 'OTHER';
  const categories = categoryOrder
    .map((category) => ({
      category,
      nodes: view.nodes.filter((node) => node.category === category),
    }))
    .filter((group) => group.nodes.length > 0);
  const activeNodes = categories.find((group) => group.category === activeCategory)?.nodes ?? [];
  const relations = selectedNode
    ? view.edges.filter(
        (edge) => edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id,
      )
    : [];

  return (
    <div className="graph-business-view">
      <aside className="graph-business-view__navigator">
        <div className="graph-business-view__section-title">
          <strong>业务主题</strong>
          <span>{view.nodes.length} 个实体</span>
        </div>
        <div className="graph-business-view__categories">
          {categories.map((group) => (
            <button
              className={cn(
                'graph-topic-button',
                group.category === activeCategory && 'graph-topic-button--active',
              )}
              key={group.category}
              onClick={() => onSelectNode(group.nodes[0].id)}
              type="button"
            >
              <span>{graphCategoryLabels[group.category]}</span>
              <em>{group.nodes.length}</em>
            </button>
          ))}
        </div>
        <div className="graph-business-view__entities">
          {activeNodes.map((node) => (
            <button
              className={cn(
                'graph-entity-button',
                node.id === selectedNode?.id && 'graph-entity-button--active',
              )}
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              title={node.name}
              type="button"
            >
              <span>{node.name}</span>
              <small>{node.displayType}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="graph-business-view__content">
        {selectedNode ? (
          <>
            <header className="graph-business-view__header">
              <div>
                <Badge variant="secondary">{graphCategoryLabels[selectedNode.category]}</Badge>
                <h3>{selectedNode.name}</h3>
                <p>与该实体直接相关的业务规则和知识关系。</p>
              </div>
              <Badge variant="info">{relations.length} 条关系</Badge>
            </header>
            {relations.length ? (
              <div className="graph-business-view__relations">
                {relations.map((edge) => {
                  const source = nodesById.get(edge.sourceId);
                  const target = nodesById.get(edge.targetId);
                  return (
                    <article
                      className={cn(
                        'graph-business-relation',
                        selectedEdgeId === edge.id && 'graph-business-relation--selected',
                      )}
                      key={edge.id}
                    >
                      <button onClick={() => onSelectEdge(edge.id)} type="button">
                        <span>{source?.name ?? '未知实体'}</span>
                        <i>
                          <ArrowRight />
                          {edge.displayLabel}
                        </i>
                        <span>{target?.name ?? '未知实体'}</span>
                      </button>
                      <p>{edge.evidence || '历史抽取结果，暂无证据片段。'}</p>
                      <Button
                        onClick={() => onOpenDocument(edge.documentId)}
                        size="sm"
                        variant="ghost"
                      >
                        <FileText />
                        {edge.documentTitle ?? '查看来源文档'}
                      </Button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="graph-business-view__empty">
                <Network />
                <strong>暂无直接关系</strong>
                <span>可选择其他业务实体，或重新抽取当前文档图谱。</span>
              </div>
            )}
          </>
        ) : (
          <div className="graph-business-view__empty">
            <Network />
            <strong>暂无业务实体</strong>
            <span>请先为文档执行图谱抽取。</span>
          </div>
        )}
      </section>
    </div>
  );
}

export function GraphRelationTable({
  onOpenDocument,
  onSelectEdge,
  selectedEdgeId,
  view,
}: {
  onOpenDocument: (documentId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  selectedEdgeId: string | null;
  view: GraphView;
}) {
  const [keyword, setKeyword] = useState('');
  const nodesById = new Map(view.nodes.map((node) => [node.id, node]));
  const normalizedKeyword = keyword.trim().toLowerCase();
  const edges = normalizedKeyword
    ? view.edges.filter((edge) => relationSearchText(edge, nodesById).includes(normalizedKeyword))
    : view.edges;

  return (
    <div className="graph-relation-table">
      <div className="graph-relation-table__toolbar">
        <div className="graph-relation-table__search">
          <Search />
          <Input
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索主体、关系、客体或证据"
            value={keyword}
          />
        </div>
        <span>
          {edges.length} / {view.edges.length} 条关系
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[840px]">
          <TableHeader>
            <TableRow>
              <TableHead>主体</TableHead>
              <TableHead>关系</TableHead>
              <TableHead>客体</TableHead>
              <TableHead>证据</TableHead>
              <TableHead>来源</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {edges.map((edge) => (
              <TableRow
                className={cn('cursor-pointer', edge.id === selectedEdgeId && 'bg-muted/60')}
                key={edge.id}
                onClick={() => onSelectEdge(edge.id)}
              >
                <TableCell className="font-medium">
                  {nodesById.get(edge.sourceId)?.name ?? '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{edge.displayLabel}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {nodesById.get(edge.targetId)?.name ?? '-'}
                </TableCell>
                <TableCell>
                  <p className="max-w-md line-clamp-2 text-xs text-muted-foreground">
                    {edge.evidence || '历史抽取结果，暂无证据片段。'}
                  </p>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDocument(edge.documentId);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <FileText />
                    {edge.documentTitle ?? '来源文档'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function relationSearchText(edge: GraphEdge, nodesById: Map<string, GraphNode>): string {
  return `${nodesById.get(edge.sourceId)?.name ?? ''} ${edge.displayLabel} ${edge.type} ${nodesById.get(edge.targetId)?.name ?? ''} ${edge.evidence ?? ''} ${edge.documentTitle ?? ''}`.toLowerCase();
}
