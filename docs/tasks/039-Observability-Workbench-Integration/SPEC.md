# TASK-039：Observability Workbench Integration

## 目标

把 TASK-037 的 Execution Timeline API 和 TASK-038 的 Readiness / Metrics Breakdown 接入前端 Demo Workbench。

本任务让演示闭环从：

```text
Upload -> Ingest -> Agent Debug -> Answer
```

升级为：

```text
System Readiness -> Metrics -> Execution Runs -> Timeline -> Agent Debug -> Answer
```

核心目标：

- 在前端展示系统依赖 readiness。
- 在前端展示关键 metrics breakdown。
- 在前端展示当前用户的 Agent execution runs。
- 在前端展示 execution timeline。
- 将 Agent Debug 的 `executionId` 与持久化 timeline 串起来。

## 禁止项

- 不新增数据库模型。
- 不新增后端领域能力。
- 不改 AgentGraph / LangGraph 编排。
- 不改 Tool Registry。
- 不实现外部 APM。
- 不接 LangSmith。
- 不展示完整 prompt。
- 不展示完整 answer。
- 不展示 document content。
- 不展示 token 原文日志。
- 不让 React 组件直接 `fetch`。
- 不让前端绕过 Service / Store。

## 后端 API 复用

复用现有 API：

```text
GET /health
GET /health/readiness
GET /metrics
GET /executions?limit=20
GET /executions/:executionId
GET /executions/:executionId/timeline
```

本任务默认不新增后端 API。

如果实现中发现已有 API 返回结构与前端类型不一致，只允许做兼容性小修，不允许扩展新的业务语义。

## 前端新增结构

新增：

```text
apps/frontend/types/observability.ts
apps/frontend/services/execution.service.ts
apps/frontend/services/observability.service.ts
apps/frontend/store/observability.store.ts
apps/frontend/components/observability/
```

组件：

```text
components/observability/
├── ObservabilityWorkbench.tsx
├── ReadinessCheckPanel.tsx
├── MetricsBreakdownPanel.tsx
├── ExecutionRunList.tsx
├── ExecutionRunDetailPanel.tsx
├── ExecutionTimeline.tsx
└── ExecutionMetadataInspector.tsx
```

改造：

```text
apps/frontend/components/workbench/DemoWorkbench.tsx
apps/frontend/store/workbench.store.ts
apps/frontend/types/workbench.ts
```

`DemoWorkbench` tab 从：

```text
Pipeline / Agent Debug / Assistant
```

扩展为：

```text
Pipeline / Observability / Agent Debug / Assistant
```

## 类型设计

新增前端类型：

```ts
type ReadinessStatus = 'ok' | 'degraded';
type ReadinessCheckStatus = 'ok' | 'failed' | 'skipped';

interface ReadinessCheck {
  name: 'database' | 'redis' | 'storage' | 'graph' | 'vector' | 'llm' | 'embedding' | 'reranker';
  status: ReadinessCheckStatus;
  durationMs?: number;
  message?: string;
}

interface ReadinessResponse {
  status: ReadinessStatus;
  timestamp: string;
  checks: ReadinessCheck[];
}

interface MetricsBreakdown {
  agent: boolean;
  retrieval: boolean;
  llm: boolean;
  ingestion: boolean;
  documentProcessing: boolean;
  embedding: boolean;
  reranker: boolean;
  vector: boolean;
  storage: boolean;
  memory: boolean;
  providerHealth: boolean;
}

type ExecutionRunStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';
type ExecutionTraceEventStatus = 'STARTED' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';

interface ExecutionRun {
  id: string;
  executionId: string;
  requestId: string;
  userId: string;
  conversationId: string | null;
  source: string;
  status: ExecutionRunStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionTraceEvent {
  id: string;
  executionId: string;
  requestId: string;
  userId: string;
  type: string;
  stage: string;
  node: string | null;
  status: ExecutionTraceEventStatus;
  durationMs: number | null;
  sequence: number;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
  timestamp: string;
}
```

## Store 设计

新增 `observability.store.ts`，保存：

```ts
interface ObservabilityState {
  readiness: ReadinessResponse | null;
  metricsText: string;
  metricsBreakdown: MetricsBreakdown | null;
  executionRuns: ExecutionRun[];
  selectedExecutionId: string | null;
  selectedRun: ExecutionRun | null;
  timeline: ExecutionTraceEvent[];
  loadingReadiness: boolean;
  loadingMetrics: boolean;
  loadingExecutions: boolean;
  loadingTimeline: boolean;
  error: string | null;
}
```

行为：

- `initialize()`
- `refreshReadiness()`
- `refreshMetrics()`
- `loadExecutions(limit?)`
- `selectExecution(executionId)`
- `loadTimeline(executionId)`
- `selectLatestExecution()`

所有 API 调用保持：

```text
Component
↓
Store
↓
Service
↓
API
```

## UI 要求

### ReadinessCheckPanel

展示：

- 总体状态：`ok / degraded`
- 每个依赖状态。
- duration。
- 短错误 message。

不得展示：

- API key。
- password。
- 连接串完整内容。

### MetricsBreakdownPanel

展示关键指标是否存在：

- agent
- retrieval
- llm
- ingestion
- documentProcessing
- embedding
- reranker
- vector
- storage
- memory
- providerHealth

第一版只做存在性和分组摘要，不做完整 Prometheus 查询 UI。

### ExecutionRunList

展示当前用户的最近 executions：

- status。
- source。
- executionId 简写。
- requestId 简写。
- duration。
- startedAt。

### ExecutionTimeline

按 `sequence` 排序展示：

- workflow
- memory
- planner
- retrieval
- graph
- answer
- verification
- iteration
- error

展示字段：

- stage。
- node。
- status。
- durationMs。
- errorMessage。
- 安全 metadata 摘要。

### ExecutionMetadataInspector

只展示安全 metadata：

- count。
- latency。
- status。
- needsRetrieval。
- needsGraph。
- needsMoreContext。
- iteration。
- maxIterations。
- verified。
- reason。

遇到未知字段时做短文本摘要，不展示长字符串。

## Agent Debug 集成

Agent Debug SSE `done` 事件中已有 `executionId`。

TASK-039 要求：

- Agent Debug 完成后保存 latest executionId。
- 提供 “Open Timeline” 入口切换到 Observability tab。
- Observability tab 自动选中该 execution。
- 如果后端 timeline 尚未写完，允许手动 refresh。

## 安全要求

- execution API 必须携带 JWT。
- 用户只能看到自己的 execution。
- 前端不缓存敏感内容。
- metadata 渲染必须做长度限制。
- error message 只显示短文本。
- 不展示 prompt / answer / document content。

## 验收标准

- 新增 5 个任务文档。
- 新增 Observability tab。
- Readiness 面板能展示 `/health/readiness`。
- Metrics 面板能解析 `/metrics` 新增指标。
- Execution 列表能调用 `/executions`。
- Timeline 能调用 `/executions/:executionId/timeline`。
- Agent Debug 完成后能跳转到对应 timeline。
- 组件不直接 `fetch`。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
