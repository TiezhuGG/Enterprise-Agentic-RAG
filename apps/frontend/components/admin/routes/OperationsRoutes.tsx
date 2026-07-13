'use client';

import { FormEvent, useState } from 'react';
import { Activity, Database, Gauge, RefreshCw } from 'lucide-react';
import { AgentDebugWorkbench } from '@/components/agent-debug';
import {
  ConsoleEmptyState,
  ConsoleErrorBanner,
  ConsolePageHeader,
  ConsoleStatusBadge,
} from '@/components/admin/ConsolePagePrimitives';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConsoleRouteKey } from '@/lib/console-routes';
import { useObservabilityStore } from '@/store/observability.store';
import { useWorkbenchStore } from '@/store/workbench.store';

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const sourceLabels: Record<string, string> = {
  agent: 'AI 问答',
  assistant: 'AI 问答',
  chat: 'AI 问答',
  ingestion: '文档入库',
  retrieval: '智能搜索',
  search: '智能搜索',
};

const stageLabels: Record<string, string> = {
  'agent-plan': '问题理解',
  'answer-generation': '生成回答',
  chunking: '文档分块',
  done: '完成',
  embedding: '向量生成',
  'graph-extraction': '图谱抽取',
  ingestion: '文档入库',
  'permission-filter': '权限过滤',
  reranker: '重排序',
  retrieval: '知识检索',
  vector: '向量召回',
};

export function OperationsRoutes({ routeKey }: { routeKey: ConsoleRouteKey }) {
  const activeView =
    routeKey === 'system-executions'
      ? 'executions'
      : routeKey === 'system-debug'
        ? 'debug'
        : 'status';
  const authToken = useWorkbenchStore((state) => state.authToken);
  const clearAuth = useWorkbenchStore((state) => state.clearAuth);
  const setAuthToken = useWorkbenchStore((state) => state.setAuthToken);
  const executionRuns = useObservabilityStore((state) => state.executionRuns);
  const loadingReadiness = useObservabilityStore((state) => state.loadingReadiness);
  const metricsBreakdown = useObservabilityStore((state) => state.metricsBreakdown);
  const readiness = useObservabilityStore((state) => state.readiness);
  const refresh = useObservabilityStore((state) => state.refresh);
  const selectExecution = useObservabilityStore((state) => state.selectExecution);
  const selectedRun = useObservabilityStore((state) => state.selectedRun);
  const timeline = useObservabilityStore((state) => state.timeline);
  const [manualToken, setManualTokenDraft] = useState(authToken);
  const page = {
    debug: { description: '用于排查认证和 Agent 执行问题的受限工具。', title: '高级调试' },
    executions: { description: '查看检索、问答和入库等平台操作的执行时间线。', title: '执行记录' },
    status: { description: '监控服务可用性、依赖检查和运行指标。', title: '系统健康' },
  }[activeView];

  const handleManualToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await setAuthToken(manualToken);
  };

  return (
    <div className="grid min-w-0 gap-4">
      <ConsolePageHeader
        actions={
          <Button onClick={() => void refresh()} variant="outline">
            <RefreshCw />
            刷新
          </Button>
        }
        description={page.description}
        title={page.title}
      />
      {activeView === 'status' ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <OperationsMetric
              icon={Gauge}
              label="总体状态"
              tone={readiness?.status === 'ok' ? 'success' : 'warning'}
              value={readiness?.status === 'ok' ? '正常' : '待检查'}
            />
            <OperationsMetric
              icon={Activity}
              label="监控指标"
              value={metricsBreakdown ? '已接入' : '待刷新'}
            />
            <OperationsMetric
              icon={Database}
              label="检查项"
              value={readiness?.checks.length ?? 0}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>服务健康检查</CardTitle>
              <CardDescription>来自 `/health/readiness` 的依赖与服务检查结果。</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReadiness ? (
                <div className="grid gap-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : !readiness ? (
                <ConsoleEmptyState
                  description="点击刷新获取系统健康状态。"
                  icon={Gauge}
                  title="暂无状态"
                />
              ) : (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {readiness.checks.map((check) => (
                    <div className="min-w-0 border p-3" key={check.name}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{check.name}</span>
                        <ConsoleStatusBadge
                          tone={
                            check.status === 'ok'
                              ? 'success'
                              : check.status === 'failed'
                                ? 'danger'
                                : 'default'
                          }
                        >
                          {check.status === 'ok'
                            ? '正常'
                            : check.status === 'failed'
                              ? '失败'
                              : '跳过'}
                        </ConsoleStatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {check.message ?? `${check.durationMs ?? 0} ms`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
      {activeView === 'executions' ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>最近执行</CardTitle>
              <CardDescription>{executionRuns.length} 条记录</CardDescription>
            </CardHeader>
            <CardContent className="grid max-h-[65vh] gap-2 overflow-auto">
              {executionRuns.length === 0 ? (
                <ConsoleEmptyState
                  description="问答、搜索或入库后会生成执行记录。"
                  icon={Activity}
                  title="暂无记录"
                />
              ) : (
                executionRuns.map((run) => (
                  <button
                    className="rounded-md border p-3 text-left text-sm transition hover:bg-muted"
                    key={run.executionId}
                    onClick={() => void selectExecution(run.executionId)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {sourceLabels[run.source.toLowerCase()] ?? run.source}
                      </span>
                      <ConsoleStatusBadge
                        tone={
                          run.status === 'SUCCEEDED'
                            ? 'success'
                            : run.status === 'FAILED'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {run.status === 'SUCCEEDED'
                          ? '成功'
                          : run.status === 'FAILED'
                            ? '失败'
                            : '运行中'}
                      </ConsoleStatusBadge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(run.startedAt)}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>执行时间线</CardTitle>
              <CardDescription>
                {selectedRun?.executionId ?? '选择一条执行记录查看详情。'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {timeline.length === 0 ? (
                <ConsoleEmptyState
                  description="选择执行记录后显示处理节点和耗时。"
                  icon={Activity}
                  title="暂无时间线"
                />
              ) : (
                timeline.map((event) => (
                  <div className="grid gap-2 border p-3 text-sm" key={event.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{stageLabels[event.stage] ?? event.stage}</span>
                      <ConsoleStatusBadge
                        tone={
                          event.status === 'SUCCEEDED'
                            ? 'success'
                            : event.status === 'FAILED'
                              ? 'danger'
                              : 'default'
                        }
                      >
                        {event.status === 'SUCCEEDED'
                          ? '成功'
                          : event.status === 'FAILED'
                            ? '失败'
                            : '跳过'}
                      </ConsoleStatusBadge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{event.type}</span>
                      <span>{formatDateTime(event.timestamp)}</span>
                      <span>{event.durationMs ?? 0} ms</span>
                    </div>
                    {event.errorMessage ? (
                      <ConsoleErrorBanner message={event.errorMessage} />
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
      {activeView === 'debug' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>访问凭证</CardTitle>
              <CardDescription>
                仅在高级调试场景使用；日常工作区自动使用当前登录凭证。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]"
                onSubmit={handleManualToken}
              >
                <Input
                  onChange={(event) => setManualTokenDraft(event.target.value)}
                  placeholder="粘贴 JWT Token"
                  type="password"
                  value={manualToken}
                />
                <Button type="submit" variant="outline">
                  保存凭证
                </Button>
                <Button onClick={clearAuth} type="button" variant="outline">
                  清除
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>高级调试面板</CardTitle>
              <CardDescription>用于排查 Agent 的执行链路和节点输出。</CardDescription>
            </CardHeader>
            <CardContent>
              <AgentDebugWorkbench />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function OperationsMetric({
  icon: Icon,
  label,
  tone = 'default',
  value,
}: {
  icon: typeof Gauge;
  label: string;
  tone?: 'default' | 'success' | 'warning';
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-blue-200 bg-blue-50 text-primary'}`}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <p className="mt-3 truncate text-2xl font-semibold tracking-normal">{value}</p>
      </CardContent>
    </Card>
  );
}
