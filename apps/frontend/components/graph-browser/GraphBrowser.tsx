'use client';

import { FormEvent, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Database,
  FileText,
  GitBranch,
  Loader2,
  Network,
  RefreshCw,
  Search,
  Target,
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

const graphExtractionLabels: Record<GraphExtractionState, string> = {
  failed: '抽取失败',
  'not-run': '尚未运行',
  skipped: '已跳过',
  success: '抽取成功',
};

export function GraphBrowser() {
  const documents = useWorkbenchStore((state) => state.documents);
  const ingestionOptions = useWorkbenchStore((state) => state.ingestionOptions);
  const ingestionStatus = useWorkbenchStore((state) => state.ingestionStatus);
  const pipelineEvents = useWorkbenchStore((state) => state.pipelineEvents);
  const pipelineJobs = useWorkbenchStore((state) => state.pipelineJobs);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedPipelineJobId = useWorkbenchStore((state) => state.selectedPipelineJobId);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectDocument = useWorkbenchStore((state) => state.selectDocument);
  const setActiveSection = useWorkbenchStore((state) => state.setActiveSection);
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
        selectedPipelineJobId,
      }),
    [ingestionOptions, ingestionStatus, pipelineEvents, pipelineJobs, selectedPipelineJobId],
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
    setActiveSection('documents');
  };

  return (
    <div className="graph-browser">
      <div className="graph-browser__header">
        <div>
          <h2>知识图谱浏览器</h2>
          <span>按空间或文档查看实体关系，支持筛选、邻居展开和来源跳转。</span>
        </div>
        <Badge variant={graphCheck?.status === 'ok' ? 'success' : 'warning'}>
          图谱服务 {graphCheck ? graphStatusLabels[graphCheck.status] : '待检查'}
        </Badge>
      </div>

      {error ? <div className="workbench-error">{error}</div> : null}

      <div className="graph-browser__stats">
        <GraphStat icon={Database} label="当前空间" value={selectedSpace?.name ?? '未选择'} />
        <GraphStat icon={FileText} label="当前文档" value={selectedDocument?.title ?? '未选择'} />
        <GraphStat icon={Network} label="实体" value={visibleView?.counts.nodes ?? 0} />
        <GraphStat icon={GitBranch} label="关系" value={visibleView?.counts.edges ?? 0} />
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

      <div className="graph-browser__grid">
        <Card className="graph-browser__canvas-card">
          <CardHeader className="graph-browser__section-header">
            <div>
              <CardTitle>图谱视图</CardTitle>
              <CardDescription>
                {view
                  ? `${scopeLabels[view.source]}图谱，当前展示 ${visibleView?.counts.nodes ?? 0} 个实体`
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
                scope={scope}
                selectedDocumentTitle={selectedDocument?.title ?? null}
                selectedSpaceName={selectedSpace?.name ?? null}
              />
            )}
          </CardContent>
        </Card>

        <div className="graph-browser__side">
          <GraphExtractionExplainabilityPanel summary={graphExplainability} />
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
  const nodePositions = useMemo(() => buildNodePositions(view.nodes), [view.nodes]);

  return (
    <div className="graph-browser__canvas">
      <svg aria-hidden="true" className="graph-browser__edges" viewBox="0 0 100 100">
        {view.edges.map((edge) => {
          const source = nodePositions.get(edge.sourceId);
          const target = nodePositions.get(edge.targetId);

          if (!source || !target) {
            return null;
          }

          return (
            <g key={edge.id}>
              <line
                className={cn(
                  'graph-browser__edge-line',
                  selectedEdgeId === edge.id && 'graph-browser__edge-line--selected',
                )}
                x1={source.x}
                x2={target.x}
                y1={source.y}
                y2={target.y}
              />
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

        if (!position) {
          return null;
        }

        return (
          <button
            className={cn(
              'graph-browser__node',
              selectedNodeId === node.id && 'graph-browser__node--selected',
            )}
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            style={{
              left: `calc(${position.x}% - 48px)`,
              top: `calc(${position.y}% - 30px)`,
            }}
            title={`${node.name} (${node.type})`}
            type="button"
          >
            <strong>{node.name}</strong>
            <span>{node.type}</span>
          </button>
        );
      })}
    </div>
  );
}

function GraphExtractionExplainabilityPanel({
  summary,
}: {
  summary: GraphExtractionExplainability;
}) {
  const typeEntries = Object.entries(summary.typeDistribution).sort(
    ([, leftCount], [, rightCount]) => rightCount - leftCount,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>抽取解释</CardTitle>
        <CardDescription>展示最近一次入库中的图谱抽取结果。</CardDescription>
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
              <Badge variant="secondary">关系</Badge>
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
        <CardTitle>关系列表</CardTitle>
        <CardDescription>展示当前过滤范围内的前 30 条关系。</CardDescription>
      </CardHeader>
      <CardContent>
        {edges.length === 0 ? (
          <div className="graph-browser__empty-mini">
            <GitBranch />
            <span>暂无关系。</span>
          </div>
        ) : (
          <div className="graph-browser__relations">
            {edges.slice(0, 30).map((edge) => {
              const source = view?.nodes.find((node) => node.id === edge.sourceId);
              const target = view?.nodes.find((node) => node.id === edge.targetId);

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
                    <strong>{edge.type}</strong>
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
  scope,
  selectedDocumentTitle,
  selectedSpaceName,
}: {
  canLoad: boolean;
  scope: GraphBrowserScope;
  selectedDocumentTitle: string | null;
  selectedSpaceName: string | null;
}) {
  const title = canLoad ? '暂无图谱数据' : scope === 'space' ? '请选择知识空间' : '请选择文档';
  const description = canLoad
    ? '请确认已在入库时启用图谱抽取，或使用搜索条件缩小范围。'
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
    </div>
  );
}

function createGraphExtractionExplainability(input: {
  ingestionOptions: IngestionOptions;
  ingestionStatus: IngestionStatus | null;
  pipelineEvents: PipelineEvent[];
  pipelineJobs: PipelineJob[];
  selectedPipelineJobId: string | null;
}): GraphExtractionExplainability {
  const selectedJob =
    input.pipelineJobs.find((job) => job.id === input.selectedPipelineJobId) ??
    input.pipelineJobs[0] ??
    null;
  const event =
    input.pipelineEvents
      .filter((item) => item.stage === 'graph-extraction')
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

function buildNodePositions(nodes: GraphNode[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const total = Math.max(nodes.length, 1);
  const centerX = 50;
  const centerY = 50;

  nodes.forEach((node, index) => {
    const ring = Math.floor(index / 36);
    const ringIndex = index % 36;
    const ringSize = Math.min(total - ring * 36, 36);
    const angle = (ringIndex / Math.max(ringSize, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = Math.max(18, 39 - ring * 8);

    positions.set(node.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  });

  return positions;
}
