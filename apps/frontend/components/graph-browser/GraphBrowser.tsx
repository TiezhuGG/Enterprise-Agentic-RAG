'use client';

import { FormEvent, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDot,
  Database,
  FileText,
  GitBranch,
  Layers3,
  Loader2,
  Network,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createGraphVisibleView,
  useGraphBrowserStore,
  type GraphVisibleView,
} from '@/store/graph-browser.store';
import { useObservabilityStore } from '@/store/observability.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { GraphBrowserScope, GraphEdge, GraphHopDepth, GraphNode } from '@/types/graph';
import type {
  IngestionOptions,
  IngestionStatus,
  PipelineEvent,
  PipelineJob,
} from '@/types/workbench';
import { cn } from '@/lib/utils';
import { buildConsoleHref } from '@/lib/console-routes';

const scopeLabels: Record<GraphBrowserScope, string> = {
  document: '当前文档',
  space: '当前空间',
};

const graphStatusLabels = {
  failed: '未连接',
  ok: '可用',
  skipped: '跳过',
} as const;

type GraphExtractionState = 'failed' | 'not-run' | 'skipped' | 'success';
type EntityVisualKind =
  | 'data'
  | 'department'
  | 'document'
  | 'policy'
  | 'process'
  | 'requirement'
  | 'role'
  | 'rule'
  | 'unknown';
type RelationVisualKind =
  'approval' | 'contains' | 'default' | 'ownership' | 'reference' | 'requirement';

interface GraphExtractionExplainability {
  enabled: boolean;
  entityCount: number | null;
  errorMessage: string | null;
  eventCreatedAt: string | null;
  jobId: string | null;
  reason: string | null;
  relationCount: number | null;
  sourceChunkCount: number | null;
  status: GraphExtractionState;
  typeDistribution: Record<string, number>;
}

interface EntityVisual {
  Icon: typeof Network;
  className: string;
  kind: EntityVisualKind;
  label: string;
}

interface RelationVisual {
  className: string;
  kind: RelationVisualKind;
  label: string;
  lineLabel: string;
}

const graphExtractionLabels: Record<GraphExtractionState, string> = {
  failed: '抽取失败',
  'not-run': '尚未运行',
  skipped: '已跳过',
  success: '抽取成功',
};

const displayModeLabels: Record<GraphVisibleView['displayMode'], string> = {
  document: '文档子图',
  empty: '空视图',
  filtered: '类型过滤',
  focus: '焦点子图',
  overview: 'Hub 概览',
  query: '搜索子图',
};

const entityLegend: EntityVisual[] = [
  {
    Icon: Building2,
    className: 'graph-node-kind--department',
    kind: 'department',
    label: '部门 / 组织',
  },
  {
    Icon: Users,
    className: 'graph-node-kind--role',
    kind: 'role',
    label: '角色 / 人员',
  },
  {
    Icon: ScrollText,
    className: 'graph-node-kind--policy',
    kind: 'policy',
    label: '制度 / 政策',
  },
  {
    Icon: ShieldCheck,
    className: 'graph-node-kind--rule',
    kind: 'rule',
    label: '规则 / 条款',
  },
  {
    Icon: Layers3,
    className: 'graph-node-kind--process',
    kind: 'process',
    label: '流程',
  },
  {
    Icon: BadgeCheck,
    className: 'graph-node-kind--requirement',
    kind: 'requirement',
    label: '材料 / 要求',
  },
  {
    Icon: Database,
    className: 'graph-node-kind--data',
    kind: 'data',
    label: '数据 / 编码',
  },
  {
    Icon: CircleDot,
    className: 'graph-node-kind--unknown',
    kind: 'unknown',
    label: '其它实体',
  },
];

const relationLegend: RelationVisual[] = [
  {
    className: 'graph-edge-kind--ownership',
    kind: 'ownership',
    label: '从属 / 负责',
    lineLabel: '实线',
  },
  {
    className: 'graph-edge-kind--contains',
    kind: 'contains',
    label: '包含 / 组成',
    lineLabel: '绿色实线',
  },
  {
    className: 'graph-edge-kind--approval',
    kind: 'approval',
    label: '审批 / 审核',
    lineLabel: '强调实线',
  },
  {
    className: 'graph-edge-kind--reference',
    kind: 'reference',
    label: '引用 / 依据',
    lineLabel: '虚线',
  },
  {
    className: 'graph-edge-kind--requirement',
    kind: 'requirement',
    label: '要求 / 需要',
    lineLabel: '点线',
  },
];

export function GraphBrowser() {
  const router = useRouter();
  const documents = useWorkbenchStore((state) => state.documents);
  const ingestionOptions = useWorkbenchStore((state) => state.ingestionOptions);
  const ingestionStatus = useWorkbenchStore((state) => state.ingestionStatus);
  const pipelineEvents = useWorkbenchStore((state) => state.pipelineEvents);
  const pipelineJobs = useWorkbenchStore((state) => state.pipelineJobs);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedPipelineJobId = useWorkbenchStore((state) => state.selectedPipelineJobId);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectDocument = useWorkbenchStore((state) => state.selectDocument);
  const retrySelectedDocumentGraph = useWorkbenchStore((state) => state.retrySelectedDocumentGraph);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const readiness = useObservabilityStore((state) => state.readiness);
  const graphCheck = readiness?.checks.find((check) => check.name === 'graph') ?? null;
  const {
    clearSelection,
    error,
    hopDepth,
    loadGraph,
    loading,
    query,
    scope,
    selectEdge,
    selectNode,
    selectedEdgeId,
    selectedNodeId,
    setHopDepth,
    setQuery,
    setScope,
    setTypeFilter,
    submitQuery,
    submittedQuery,
    typeFilter,
    view,
  } = useGraphBrowserStore();
  const visibleView = useMemo(
    () =>
      createGraphVisibleView({
        hopDepth,
        selectedEdgeId,
        selectedNodeId,
        submittedQuery,
        typeFilter,
        view,
      }),
    [hopDepth, selectedEdgeId, selectedNodeId, submittedQuery, typeFilter, view],
  );
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const selectedEdge = visibleView?.selectedEdge ?? null;
  const selectedNode = visibleView?.selectedNode ?? null;
  const graphExplainability = useMemo(
    () =>
      createGraphExtractionExplainability({
        ingestionOptions,
        ingestionStatus,
        pipelineEvents,
        pipelineJobs,
        selectedDocumentId,
        selectedPipelineJobId,
      }),
    [ingestionOptions, ingestionStatus, pipelineEvents, pipelineJobs, selectedDocumentId, selectedPipelineJobId],
  );
  const canLoad = scope === 'space' ? Boolean(selectedSpaceId) : Boolean(selectedDocumentId);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph, scope, selectedDocumentId, selectedSpaceId, submittedQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuery();
  };

  const handleScopeChange = (nextScope: GraphBrowserScope) => {
    setScope(nextScope);
  };

  const handleOpenDocument = (documentId: string | null | undefined) => {
    if (!documentId) {
      return;
    }

    void selectDocument(documentId);
    router.push(buildConsoleHref('documents', { space: selectedSpaceId }));
  };

  return (
    <div className="graph-browser">
      <div className="graph-browser__header">
        <div>
          <h2>知识图谱浏览器</h2>
          <span>默认展示关键子图；搜索或点击实体后再展开相关关系，避免一次性铺满全图。</span>
        </div>
        <Badge variant={graphCheck?.status === 'ok' ? 'success' : 'warning'}>
          图谱服务 {graphCheck ? graphStatusLabels[graphCheck.status] : '待检查'}
        </Badge>
      </div>

      {error ? <div className="workbench-error">{error}</div> : null}

      <div className="graph-browser__stats">
        <GraphStat icon={Database} label="当前空间" value={selectedSpace?.name ?? '未选择'} />
        <GraphStat icon={FileText} label="当前文档" value={selectedDocument?.title ?? '未选择'} />
        <GraphStat icon={Network} label="当前实体" value={visibleView?.counts.nodes ?? 0} />
        <GraphStat icon={GitBranch} label="当前关系" value={visibleView?.counts.edges ?? 0} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <form className="graph-browser__toolbar" onSubmit={handleSubmit}>
            <label className="graph-browser__field">
              <span>范围</span>
              <Select
                onValueChange={(value) => handleScopeChange(value as GraphBrowserScope)}
                value={scope}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="space">{scopeLabels.space}</SelectItem>
                  <SelectItem value="document">{scopeLabels.document}</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="graph-browser__field">
              <span>文档</span>
              <Select
                disabled={scope !== 'document' || documents.length === 0}
                onValueChange={(documentId) => void selectDocument(documentId)}
                value={selectedDocumentId ?? undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择文档" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((document) => (
                    <SelectItem key={document.id} value={document.id}>
                      {document.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="graph-browser__field">
              <span>实体类型</span>
              <Select onValueChange={setTypeFilter} value={typeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部类型</SelectItem>
                  {(visibleView?.typeOptions ?? []).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="graph-browser__field">
              <span>邻居深度</span>
              <div className="graph-browser__segments">
                {[1, 2].map((depth) => (
                  <Button
                    key={depth}
                    onClick={() => setHopDepth(depth as GraphHopDepth)}
                    size="sm"
                    type="button"
                    variant={hopDepth === depth ? 'default' : 'outline'}
                  >
                    {depth} 跳
                  </Button>
                ))}
              </div>
            </label>

            <div className="graph-browser__query">
              <Search />
              <Input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索实体、实体类型或关系"
                value={query}
              />
            </div>

            <Button disabled={!canLoad || loading} type="submit">
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
              查询
            </Button>
            <Button
              disabled={!canLoad || loading}
              onClick={() => void loadGraph()}
              type="button"
              variant="outline"
            >
              <RefreshCw />
              刷新
            </Button>
          </form>
        </CardContent>
      </Card>

      <GraphDisclosureGuide view={visibleView} />

      <div className="graph-browser__grid">
        <Card className="graph-browser__canvas-card">
          <CardHeader className="graph-browser__section-header">
            <div>
              <CardTitle>图谱视图</CardTitle>
              <CardDescription>
                {visibleView
                  ? `${displayModeLabels[visibleView.displayMode]}：显示 ${visibleView.counts.nodes}/${visibleView.totalCounts.nodes} 个实体，${visibleView.counts.edges}/${visibleView.totalCounts.edges} 条关系`
                  : '等待加载图谱数据'}
              </CardDescription>
            </div>
            {selectedNodeId || selectedEdgeId ? (
              <Button onClick={clearSelection} size="sm" type="button" variant="outline">
                清除选择
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <GraphLoading />
            ) : visibleView && visibleView.nodes.length > 0 ? (
              <GraphCanvas
                onSelectEdge={selectEdge}
                onSelectNode={selectNode}
                selectedEdgeId={selectedEdgeId}
                selectedNodeId={selectedNodeId}
                view={visibleView}
              />
            ) : (
              <GraphEmptyState
                canLoad={canLoad}
                explanation={graphExplainability}
                onRetry={() => void retrySelectedDocumentGraph()}
                scope={scope}
                selectedDocumentTitle={selectedDocument?.title ?? null}
                selectedSpaceName={selectedSpace?.name ?? null}
              />
            )}
          </CardContent>
        </Card>

        <div className="graph-browser__side">
          <GraphLegend />
          <GraphExtractionExplainabilityPanel
            canRetry={Boolean(selectedDocumentId) && graphExplainability.status === 'failed'}
            onRetry={() => void retrySelectedDocumentGraph()}
            summary={graphExplainability}
          />
          <GraphSelectionPanel
            edge={selectedEdge}
            node={selectedNode}
            onOpenDocument={handleOpenDocument}
            view={visibleView}
          />
          <GraphRelationList
            onOpenDocument={handleOpenDocument}
            onSelectEdge={selectEdge}
            selectedEdgeId={selectedEdgeId}
            view={visibleView}
          />
        </div>
      </div>
    </div>
  );
}

function GraphStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Network;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="graph-browser__stat">
        <Icon />
        <div>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      </CardContent>
    </Card>
  );
}

function GraphDisclosureGuide({ view }: { view: GraphVisibleView | null }) {
  const hiddenNodeCount = view?.hiddenCounts.nodes ?? 0;

  return (
    <Card className="graph-browser__guide">
      <CardContent>
        <div>
          <strong>渐进式查看</strong>
          <span>
            先看高连接度实体概览；点击节点展开{' '}
            {view?.displayMode === 'focus' ? '当前焦点' : '1/2 跳邻居'}
            ；输入关键词只显示命中的相关子图。
          </span>
        </div>
        {view && hiddenNodeCount > 0 ? (
          <Badge variant="secondary">已隐藏 {hiddenNodeCount} 个非当前焦点实体</Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GraphCanvas({
  onSelectEdge,
  onSelectNode,
  selectedEdgeId,
  selectedNodeId,
  view,
}: {
  onSelectEdge: (edgeId: string | null) => void;
  onSelectNode: (nodeId: string | null) => void;
  selectedEdgeId: string | null;
  selectedNodeId: string | null;
  view: GraphVisibleView;
}) {
  const nodePositions = useMemo(
    () => buildNodePositions(view.nodes, selectedNodeId),
    [selectedNodeId, view.nodes],
  );

  return (
    <div className="graph-browser__canvas">
      <div className="graph-browser__canvas-hint">
        <Badge variant="secondary">{displayModeLabels[view.displayMode]}</Badge>
        <span>
          点击实体聚焦子图；点击关系查看来源文档。隐藏 {view.hiddenCounts.nodes} 个实体 /{' '}
          {view.hiddenCounts.edges} 条关系。
        </span>
      </div>

      <svg aria-hidden="true" className="graph-browser__edges" viewBox="0 0 100 100">
        {view.edges.map((edge) => {
          const source = nodePositions.get(edge.sourceId);
          const target = nodePositions.get(edge.targetId);
          const relationVisual = getRelationVisual(edge.type);

          if (!source || !target) {
            return null;
          }

          const middle = {
            x: (source.x + target.x) / 2,
            y: (source.y + target.y) / 2,
          };

          return (
            <g key={edge.id}>
              <line
                className={cn(
                  'graph-browser__edge-line',
                  relationVisual.className,
                  selectedEdgeId === edge.id && 'graph-browser__edge-line--selected',
                )}
                x1={source.x}
                x2={target.x}
                y1={source.y}
                y2={target.y}
              />
              <text className="graph-browser__edge-label" x={middle.x} y={middle.y}>
                {edge.type}
              </text>
              <line
                className="graph-browser__edge-hit"
                onClick={() => onSelectEdge(edge.id)}
                x1={source.x}
                x2={target.x}
                y1={source.y}
                y2={target.y}
              />
            </g>
          );
        })}
      </svg>

      {view.nodes.map((node) => {
        const position = nodePositions.get(node.id);
        const visual = getEntityVisual(node.type);
        const Icon = visual.Icon;

        if (!position) {
          return null;
        }

        return (
          <button
            className={cn(
              'graph-browser__node',
              visual.className,
              selectedNodeId === node.id && 'graph-browser__node--selected',
            )}
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            style={{
              left: `calc(${position.x}% - 62px)`,
              top: `calc(${position.y}% - 34px)`,
            }}
            title={`${node.name} (${node.type})`}
            type="button"
          >
            <span className="graph-browser__node-marker">
              <Icon />
            </span>
            <span className="graph-browser__node-copy">
              <strong>{node.name}</strong>
              <em>{node.type}</em>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GraphLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>图例</CardTitle>
        <CardDescription>节点颜色表示实体类型，线型表示关系语义。</CardDescription>
      </CardHeader>
      <CardContent className="graph-browser__legend">
        <div>
          <strong>实体类型</strong>
          <div className="graph-browser__legend-grid">
            {entityLegend.map((item) => {
              const Icon = item.Icon;

              return (
                <span className="graph-legend-entity" key={item.kind}>
                  <i className={cn('graph-browser__node-marker', item.className)}>
                    <Icon />
                  </i>
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <div>
          <strong>关系类型</strong>
          <div className="graph-browser__legend-grid">
            {relationLegend.map((item) => (
              <span className="graph-legend-relation" key={item.kind}>
                <i className={cn('graph-legend-relation__line', item.className)} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GraphExtractionExplainabilityPanel({
  canRetry,
  onRetry,
  summary,
}: {
  canRetry: boolean;
  onRetry: () => void;
  summary: GraphExtractionExplainability;
}) {
  const typeEntries = Object.entries(summary.typeDistribution).sort(
    ([, leftCount], [, rightCount]) => rightCount - leftCount,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>抽取解释</CardTitle>
        <CardDescription>展示当前所选文档最近一次任务的图谱抽取结果。</CardDescription>
      </CardHeader>
      <CardContent className="graph-explainability">
        <div className="graph-explainability__top">
          <Badge variant={toGraphExtractionBadge(summary.status)}>
            {graphExtractionLabels[summary.status]}
          </Badge>
          <span>{summary.enabled ? '本次任务已启用图谱' : '本次任务未启用图谱'}</span>
        </div>

        <div className="graph-explainability__stats">
          <div>
            <span>实体</span>
            <strong>{summary.entityCount ?? '-'}</strong>
          </div>
          <div>
            <span>关系</span>
            <strong>{summary.relationCount ?? '-'}</strong>
          </div>
          <div>
            <span>来源分块</span>
            <strong>{summary.sourceChunkCount ?? '-'}</strong>
          </div>
        </div>

        {summary.reason ? <p className="graph-explainability__note">{summary.reason}</p> : null}
        {summary.errorMessage ? (
          <p className="graph-explainability__error">{summary.errorMessage}</p>
        ) : null}
        {canRetry ? <Button onClick={onRetry} size="sm" variant="outline"><RefreshCw />仅重试图谱抽取</Button> : null}

        {typeEntries.length > 0 ? (
          <div className="graph-explainability__types">
            <span>实体类型分布</span>
            {typeEntries.slice(0, 8).map(([type, count]) => (
              <div key={type}>
                <strong>{type}</strong>
                <em>{count}</em>
              </div>
            ))}
          </div>
        ) : (
          <div className="graph-browser__empty-mini">
            <Network />
            <span>暂无实体类型分布。</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GraphSelectionPanel({
  edge,
  node,
  onOpenDocument,
  view,
}: {
  edge: GraphEdge | null;
  node: GraphNode | null;
  onOpenDocument: (documentId: string | null | undefined) => void;
  view: GraphVisibleView | null;
}) {
  const source = edge ? view?.nodes.find((item) => item.id === edge.sourceId) : null;
  const target = edge ? view?.nodes.find((item) => item.id === edge.targetId) : null;
  const nodeRelations = node
    ? (view?.edges ?? []).filter((item) => item.sourceId === node.id || item.targetId === node.id)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>选择详情</CardTitle>
        <CardDescription>点击节点或关系查看来源信息。</CardDescription>
      </CardHeader>
      <CardContent className="graph-browser__details">
        {node ? (
          <div className="graph-detail-card">
            <div className="graph-detail-card__top">
              <Badge variant="info">实体</Badge>
              <span>{node.type}</span>
            </div>
            <strong>{node.name}</strong>
            <span>当前子图内关联关系 {nodeRelations.length} 条</span>
            <Button onClick={() => onOpenDocument(node.documentId)} size="sm" variant="outline">
              <FileText />
              打开来源文档
            </Button>
          </div>
        ) : null}

        {edge ? (
          <div className="graph-detail-card">
            <div className="graph-detail-card__top">
              <Badge variant="secondary">{getRelationVisual(edge.type).label}</Badge>
              <span>{edge.type}</span>
            </div>
            <strong>
              {source?.name ?? edge.sourceId}
              <ArrowRight />
              {target?.name ?? edge.targetId}
            </strong>
            <span>来源文档：{edge.documentId}</span>
            <Button onClick={() => onOpenDocument(edge.documentId)} size="sm" variant="outline">
              <FileText />
              打开来源文档
            </Button>
          </div>
        ) : null}

        {!node && !edge ? (
          <div className="graph-browser__empty-mini">
            <Target />
            <span>尚未选择实体或关系。</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GraphRelationList({
  onOpenDocument,
  onSelectEdge,
  selectedEdgeId,
  view,
}: {
  onOpenDocument: (documentId: string | null | undefined) => void;
  onSelectEdge: (edgeId: string | null) => void;
  selectedEdgeId: string | null;
  view: GraphVisibleView | null;
}) {
  const edges = view?.edges ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>当前子图关系</CardTitle>
        <CardDescription>只列出当前可见子图内的前 30 条关系。</CardDescription>
      </CardHeader>
      <CardContent>
        {edges.length === 0 ? (
          <div className="graph-browser__empty-mini">
            <GitBranch />
            <span>当前子图暂无关系。</span>
          </div>
        ) : (
          <div className="graph-browser__relations">
            {edges.slice(0, 30).map((edge) => {
              const source = view?.nodes.find((node) => node.id === edge.sourceId);
              const target = view?.nodes.find((node) => node.id === edge.targetId);
              const visual = getRelationVisual(edge.type);

              return (
                <div
                  className={cn(
                    'graph-relation-item',
                    selectedEdgeId === edge.id && 'graph-relation-item--selected',
                  )}
                  key={edge.id}
                >
                  <button
                    className="graph-relation-item__main"
                    onClick={() => onSelectEdge(edge.id)}
                    type="button"
                  >
                    <span>
                      {source?.name ?? edge.sourceId}
                      <ArrowRight />
                      {target?.name ?? edge.targetId}
                    </span>
                    <strong>
                      <i className={cn('graph-relation-item__line', visual.className)} />
                      {edge.type}
                    </strong>
                  </button>
                  <Button
                    onClick={() => onOpenDocument(edge.documentId)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    来源
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GraphLoading() {
  return (
    <div className="graph-browser__loading">
      <Loader2 className="animate-spin" />
      <span>正在加载图谱...</span>
    </div>
  );
}

function GraphEmptyState({
  canLoad,
  explanation,
  onRetry,
  scope,
  selectedDocumentTitle,
  selectedSpaceName,
}: {
  canLoad: boolean;
  explanation: GraphExtractionExplainability;
  onRetry: () => void;
  scope: GraphBrowserScope;
  selectedDocumentTitle: string | null;
  selectedSpaceName: string | null;
}) {
  const title = canLoad ? '暂无图谱数据' : scope === 'space' ? '请选择知识空间' : '请选择文档';
  const description = canLoad
    ? explanation.status === 'failed'
      ? `最近一次图谱抽取失败：${explanation.errorMessage ?? explanation.reason ?? '大模型或图谱服务不可用。文档基础检索仍可使用。'}`
      : '请确认已在入库时启用图谱抽取，或使用搜索条件缩小范围。'
    : scope === 'space'
      ? '选择空间后可以浏览该空间下的实体关系。'
      : '选择文档后可以查看该文档抽取出的实体关系。';

  return (
    <div className="graph-browser__empty">
      <Network />
      <strong>{title}</strong>
      <span>{description}</span>
      <Badge variant="secondary">
        {scope === 'space'
          ? (selectedSpaceName ?? '空间未选择')
          : (selectedDocumentTitle ?? '文档未选择')}
      </Badge>
      {explanation.status === 'failed' && scope === 'document' ? <Button onClick={onRetry} size="sm" variant="outline"><RefreshCw />仅重试图谱抽取</Button> : null}
    </div>
  );
}

function createGraphExtractionExplainability(input: {
  ingestionOptions: IngestionOptions;
  ingestionStatus: IngestionStatus | null;
  pipelineEvents: PipelineEvent[];
  pipelineJobs: PipelineJob[];
  selectedDocumentId: string | null;
  selectedPipelineJobId: string | null;
}): GraphExtractionExplainability {
  const selectedJob =
    input.pipelineJobs.find((job) => job.id === input.selectedPipelineJobId) ??
    input.pipelineJobs.find((job) => job.documentId === input.selectedDocumentId) ??
    input.pipelineJobs[0] ??
    null;
  const event =
    input.pipelineEvents
      .filter((item) => item.stage === 'graph-extraction' && item.jobId === selectedJob?.id)
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )[0] ?? null;
  const metadata = event?.metadata ?? {};
  const enabled =
    readBoolean(selectedJob?.metadata.includeGraph) ?? input.ingestionOptions.includeGraph;
  const status = toGraphExtractionState(event?.status);
  const reason = toGraphExtractionReason(status, readString(metadata.reason), enabled);

  return {
    enabled,
    entityCount:
      readNumber(metadata.graphEntities) ?? input.ingestionStatus?.graphEntityCount ?? null,
    errorMessage: event?.status === 'FAILED' ? event.errorMessage : null,
    eventCreatedAt: event?.createdAt ?? null,
    jobId: selectedJob?.id ?? null,
    reason,
    relationCount:
      readNumber(metadata.graphRelations) ?? input.ingestionStatus?.graphRelationCount ?? null,
    sourceChunkCount: readNumber(metadata.sourceChunkCount),
    status,
    typeDistribution: readNumberRecord(metadata.entityTypeDistribution),
  };
}

function toGraphExtractionState(status: PipelineEvent['status'] | undefined): GraphExtractionState {
  if (status === 'SUCCEEDED') {
    return 'success';
  }

  if (status === 'FAILED') {
    return 'failed';
  }

  if (status === 'SKIPPED') {
    return 'skipped';
  }

  return 'not-run';
}

function toGraphExtractionReason(
  status: GraphExtractionState,
  reason: string | null,
  enabled: boolean,
): string | null {
  if (reason === 'includeGraph=false') {
    return '本次入库关闭了图谱抽取，基础 RAG 链路仍可用。';
  }

  if (reason === 'graph-extraction-failed') {
    return '图谱增强阶段失败，文档仍会保留基础检索能力。';
  }

  if (reason) {
    return reason;
  }

  if (status === 'not-run') {
    return enabled ? '当前文档还没有可解释的图谱抽取记录。' : '当前入库选项默认不启用图谱抽取。';
  }

  if (status === 'skipped') {
    return '图谱抽取被跳过。';
  }

  return null;
}

function toGraphExtractionBadge(
  status: GraphExtractionState,
): 'destructive' | 'secondary' | 'success' | 'warning' {
  if (status === 'success') {
    return 'success';
  }

  if (status === 'failed') {
    return 'destructive';
  }

  if (status === 'skipped') {
    return 'warning';
  }

  return 'secondary';
}

function getEntityVisual(type: string): EntityVisual {
  const normalizedType = type.toUpperCase();

  if (/(DEPARTMENT|ORG|ORGANIZATION|TEAM|部门|组织)/i.test(normalizedType)) {
    return entityLegend[0];
  }

  if (/(ROLE|PERSON|USER|岗位|角色|人员)/i.test(normalizedType)) {
    return entityLegend[1];
  }

  if (/(POLICY|制度|政策|DOCUMENT)/i.test(normalizedType)) {
    return entityLegend[2];
  }

  if (/(RULE|TERM|CLAUSE|条款|规则)/i.test(normalizedType)) {
    return entityLegend[3];
  }

  if (/(PROCESS|WORKFLOW|流程)/i.test(normalizedType)) {
    return entityLegend[4];
  }

  if (/(REQUIREMENT|MATERIAL|EVIDENCE|要求|材料|凭证)/i.test(normalizedType)) {
    return entityLegend[5];
  }

  if (/(DATA|CODE|AMOUNT|NUMBER|编码|数据|金额)/i.test(normalizedType)) {
    return entityLegend[6];
  }

  return entityLegend[7];
}

function getRelationVisual(type: string): RelationVisual {
  if (/(负责|归属|属于|OWNER|BELONG|MANAGE)/i.test(type)) {
    return relationLegend[0];
  }

  if (/(包含|组成|包括|CONTAIN|INCLUDE|PART)/i.test(type)) {
    return relationLegend[1];
  }

  if (/(审批|审核|批准|APPROV|REVIEW)/i.test(type)) {
    return relationLegend[2];
  }

  if (/(引用|依据|参考|CITE|REFERENCE)/i.test(type)) {
    return relationLegend[3];
  }

  if (/(要求|需要|必须|REQUIRE|NEED|MUST)/i.test(type)) {
    return relationLegend[4];
  }

  return {
    className: 'graph-edge-kind--default',
    kind: 'default',
    label: '其它关系',
    lineLabel: '灰色实线',
  };
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readNumber(value: unknown): number | null {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, readNumber(item)] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] !== null),
  );
}

function buildNodePositions(
  nodes: GraphNode[],
  selectedNodeId: string | null,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (nodes.length === 0) {
    return positions;
  }

  if (selectedNodeId && nodes.some((node) => node.id === selectedNodeId)) {
    positions.set(selectedNodeId, {
      x: 50,
      y: 50,
    });
    const neighbors = nodes.filter((node) => node.id !== selectedNodeId);

    neighbors.forEach((node, index) => {
      const angle = (index / Math.max(neighbors.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = neighbors.length <= 8 ? 30 : 37;

      positions.set(node.id, {
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
      });
    });

    return positions;
  }

  const total = Math.max(nodes.length, 1);

  nodes.forEach((node, index) => {
    const ring = Math.floor(index / 18);
    const ringIndex = index % 18;
    const ringSize = Math.min(total - ring * 18, 18);
    const angle = (ringIndex / Math.max(ringSize, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = Math.max(18, 36 - ring * 10);

    positions.set(node.id, {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    });
  });

  return positions;
}
