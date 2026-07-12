'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  ListTree,
  Loader2,
  Network,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  Table2,
  Target,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import type {
  GraphBrowserScope,
  GraphEdge,
  GraphEntityCategory,
  GraphHopDepth,
  GraphNode,
  GraphView,
} from '@/types/graph';
import type {
  IngestionOptions,
  IngestionStatus,
  PipelineEvent,
  PipelineJob,
} from '@/types/workbench';
import { cn } from '@/lib/utils';
import { buildConsoleHref } from '@/lib/console-routes';
import { EnterpriseGraphCanvas } from './EnterpriseGraphCanvas';
import { GraphBusinessView, GraphRelationTable, graphCategoryLabels } from './GraphBusinessViews';

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
type GraphViewMode = 'business' | 'network' | 'relations';
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
    expandFocus,
    focusLimit,
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
  const [viewMode, setViewMode] = useState<GraphViewMode>('business');
  const visibleView = useMemo(
    () =>
      createGraphVisibleView({
        focusLimit,
        hopDepth,
        selectedEdgeId,
        selectedNodeId,
        submittedQuery,
        typeFilter,
        view,
      }),
    [focusLimit, hopDepth, selectedEdgeId, selectedNodeId, submittedQuery, typeFilter, view],
  );
  const businessView = useMemo(
    () => createBusinessGraphView(view, typeFilter, submittedQuery),
    [submittedQuery, typeFilter, view],
  );
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const selectedEdge = view?.edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const selectedNode = view?.nodes.find((node) => node.id === selectedNodeId) ?? null;
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
    [
      ingestionOptions,
      ingestionStatus,
      pipelineEvents,
      pipelineJobs,
      selectedDocumentId,
      selectedPipelineJobId,
    ],
  );
  const canLoad = scope === 'space' ? Boolean(selectedSpaceId) : Boolean(selectedDocumentId);
  const canExpandFocus = Boolean(
    selectedNodeId && visibleView && visibleView.hiddenCounts.nodes > 0 && focusLimit < 49,
  );

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

  const handleViewModeChange = (nextMode: string) => {
    const normalizedMode = nextMode as GraphViewMode;
    setViewMode(normalizedMode);

    if (normalizedMode === 'network' && !selectedNodeId && businessView?.nodes.length) {
      selectNode(findPrimaryNode(businessView).id);
    }
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
          <h2>企业知识图谱</h2>
          <span>从业务主题理解实体、规则与来源；需要时再进入局部关系图。</span>
        </div>
        <Badge variant={graphCheck?.status === 'ok' ? 'success' : 'warning'}>
          图谱服务 {graphCheck ? graphStatusLabels[graphCheck.status] : '待检查'}
        </Badge>
      </div>

      {error ? <div className="workbench-error">{error}</div> : null}

      <div className="graph-browser__stats">
        <GraphStat icon={Database} label="当前空间" value={selectedSpace?.name ?? '未选择'} />
        <GraphStat icon={FileText} label="当前文档" value={selectedDocument?.title ?? '未选择'} />
        <GraphStat icon={Network} label="实体总数" value={businessView?.counts.nodes ?? 0} />
        <GraphStat icon={GitBranch} label="关系总数" value={businessView?.counts.edges ?? 0} />
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
                      {graphCategoryLabels[type as GraphEntityCategory] ?? type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            {viewMode === 'network' ? (
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
            ) : null}

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

      <Tabs onValueChange={handleViewModeChange} value={viewMode}>
        <div className="graph-view-tabs">
          <TabsList>
            <TabsTrigger value="business">
              <ListTree />
              业务视图
            </TabsTrigger>
            <TabsTrigger value="network">
              <Network />
              关系图
            </TabsTrigger>
            <TabsTrigger value="relations">
              <Table2 />
              关系清单
            </TabsTrigger>
          </TabsList>
          {selectedNodeId || selectedEdgeId ? (
            <Button onClick={clearSelection} size="sm" type="button" variant="outline">
              清除选择
            </Button>
          ) : null}
        </div>
        <div className="graph-browser__grid">
          <div className="graph-browser__primary">
            {loading ? (
              <GraphLoading />
            ) : businessView && businessView.nodes.length > 0 ? (
              <>
                <TabsContent value="business">
                  <GraphBusinessView
                    onOpenDocument={handleOpenDocument}
                    onSelectEdge={selectEdge}
                    onSelectNode={selectNode}
                    selectedEdgeId={selectedEdgeId}
                    selectedNodeId={selectedNodeId}
                    view={businessView}
                  />
                </TabsContent>
                <TabsContent value="network">
                  <GraphDisclosureGuide view={visibleView} />
                  {visibleView && visibleView.nodes.length > 0 ? (
                    <EnterpriseGraphCanvas
                      canExpand={canExpandFocus}
                      onExpand={expandFocus}
                      onSelectEdge={selectEdge}
                      onSelectNode={selectNode}
                      selectedEdgeId={selectedEdgeId}
                      selectedNodeId={selectedNodeId}
                      view={visibleView}
                    />
                  ) : null}
                  <GraphLegend />
                </TabsContent>
                <TabsContent value="relations">
                  <GraphRelationTable
                    onOpenDocument={handleOpenDocument}
                    onSelectEdge={selectEdge}
                    selectedEdgeId={selectedEdgeId}
                    view={businessView}
                  />
                </TabsContent>
              </>
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
          </div>

          <div className="graph-browser__side">
            <GraphExtractionExplainabilityPanel
              canRetry={Boolean(selectedDocumentId) && graphExplainability.status === 'failed'}
              onRetry={() => void retrySelectedDocumentGraph()}
              summary={graphExplainability}
            />
            <GraphSelectionPanel
              edge={selectedEdge}
              node={selectedNode}
              onOpenDocument={handleOpenDocument}
              view={businessView}
            />
          </div>
        </div>
      </Tabs>
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
        {canRetry ? (
          <Button onClick={onRetry} size="sm" variant="outline">
            <RefreshCw />
            仅重试图谱抽取
          </Button>
        ) : null}

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
  view: GraphView | null;
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
              <span>{node.displayType}</span>
            </div>
            <strong>{node.name}</strong>
            <span>关联关系 {nodeRelations.length} 条</span>
            <Button onClick={() => onOpenDocument(node.documentId)} size="sm" variant="outline">
              <FileText />
              打开来源文档
            </Button>
          </div>
        ) : null}

        {edge ? (
          <div className="graph-detail-card">
            <div className="graph-detail-card__top">
              <Badge variant="secondary">{edge.displayLabel}</Badge>
              <span>{edge.type === edge.displayLabel ? '标准关系' : edge.type}</span>
            </div>
            <strong className="graph-detail-card__relation">
              {source?.name ?? edge.sourceId}
              <ArrowRight />
              <em>{edge.displayLabel}</em>
              <ArrowRight />
              {target?.name ?? edge.targetId}
            </strong>
            <div className="graph-detail-card__evidence">
              <span>证据片段</span>
              <p>{edge.evidence ?? '历史抽取结果，暂无证据片段。'}</p>
            </div>
            <span>来源文档：{edge.documentTitle ?? edge.documentId}</span>
            {!edge.sourceChunkId ? <Badge variant="outline">历史抽取结果</Badge> : null}
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
      {explanation.status === 'failed' && scope === 'document' ? (
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCw />
          仅重试图谱抽取
        </Button>
      ) : null}
    </div>
  );
}

function createBusinessGraphView(
  view: GraphView | null,
  typeFilter: string,
  query: string,
): GraphView | null {
  if (!view) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const typeMatchedNodeIds = new Set(
    view.nodes
      .filter((node) => typeFilter === 'ALL' || node.category === typeFilter)
      .map((node) => node.id),
  );
  const anchorNodeIds = new Set<string>();

  for (const node of view.nodes) {
    if (!typeMatchedNodeIds.has(node.id)) {
      continue;
    }

    const searchable =
      `${node.name} ${node.type} ${node.displayType} ${node.category}`.toLowerCase();
    if (!normalizedQuery || searchable.includes(normalizedQuery)) {
      anchorNodeIds.add(node.id);
    }
  }

  if (normalizedQuery) {
    for (const edge of view.edges) {
      const searchable =
        `${edge.type} ${edge.displayLabel} ${edge.evidence ?? ''} ${edge.documentTitle ?? ''}`.toLowerCase();
      if (searchable.includes(normalizedQuery)) {
        if (typeMatchedNodeIds.has(edge.sourceId)) anchorNodeIds.add(edge.sourceId);
        if (typeMatchedNodeIds.has(edge.targetId)) anchorNodeIds.add(edge.targetId);
      }
    }
  }

  const matchedNodeIds = new Set(anchorNodeIds);
  for (const edge of view.edges) {
    if (anchorNodeIds.has(edge.sourceId) || anchorNodeIds.has(edge.targetId)) {
      matchedNodeIds.add(edge.sourceId);
      matchedNodeIds.add(edge.targetId);
    }
  }

  const edges = view.edges.filter(
    (edge) => matchedNodeIds.has(edge.sourceId) && matchedNodeIds.has(edge.targetId),
  );
  const nodes = view.nodes.filter((node) => matchedNodeIds.has(node.id));

  return {
    ...view,
    counts: { edges: edges.length, nodes: nodes.length },
    edges,
    nodes,
  };
}

function findPrimaryNode(view: GraphView): GraphNode {
  const degrees = new Map<string, number>();

  for (const edge of view.edges) {
    degrees.set(edge.sourceId, (degrees.get(edge.sourceId) ?? 0) + 1);
    degrees.set(edge.targetId, (degrees.get(edge.targetId) ?? 0) + 1);
  }

  return [...view.nodes].sort((left, right) => {
    const categoryPriority = Number(left.category !== 'OTHER') - Number(right.category !== 'OTHER');
    if (categoryPriority !== 0) return -categoryPriority;

    const degreeDelta = (degrees.get(right.id) ?? 0) - (degrees.get(left.id) ?? 0);
    if (degreeDelta !== 0) return degreeDelta;

    return left.name.localeCompare(right.name, 'zh-CN');
  })[0];
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
