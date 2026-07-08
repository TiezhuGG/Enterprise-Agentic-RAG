# TASK-039：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的前端与可观测性工程师。

必须严格遵守现有 DDD / Frontend 分层。

## 任务

实现 TASK-039：Observability Workbench Integration。

在写代码前必须阅读：

```text
docs/tasks/039-Observability-Workbench-Integration/SPEC.md
docs/tasks/039-Observability-Workbench-Integration/SEQUENCE.md
docs/tasks/039-Observability-Workbench-Integration/ADR.md
docs/tasks/039-Observability-Workbench-Integration/REVIEW.md
docs/tasks/039-Observability-Workbench-Integration/CODEX.md
```

## 目标

把现有后端可观测能力接入前端 Demo Workbench：

- `/health/readiness`
- `/metrics`
- `/executions`
- `/executions/:executionId`
- `/executions/:executionId/timeline`

新增 Observability tab，让用户能查看：

- 系统 readiness。
- 指标 breakdown。
- 当前用户 execution runs。
- execution timeline。
- 安全 metadata。

并让 Agent Debug 完成后可以通过 `executionId` 跳转到持久化 timeline。

## 必须实现

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
ObservabilityWorkbench
ReadinessCheckPanel
MetricsBreakdownPanel
ExecutionRunList
ExecutionRunDetailPanel
ExecutionTimeline
ExecutionMetadataInspector
```

改造：

```text
apps/frontend/components/workbench/DemoWorkbench.tsx
apps/frontend/store/workbench.store.ts
apps/frontend/types/workbench.ts
apps/frontend/store/agent-debug.store.ts
apps/frontend/components/agent-debug/AgentExecutionSummary.tsx
```

## API 规则

前端调用必须保持：

```text
Component
↓
Store
↓
Service
↓
API
```

禁止：

- React component 直接 `fetch`。
- Store 拼接裸 URL。
- 组件访问 localStorage token。

## UI 行为

DemoWorkbench tab 扩展为：

```text
Pipeline / Observability / Agent Debug / Assistant
```

Observability tab：

- 顶部展示 Readiness。
- 展示 Metrics Breakdown。
- 左侧展示 Execution Run List。
- 中间展示 Timeline。
- 右侧展示 Run Detail / Metadata。

Agent Debug：

- SSE `done` 后保存 latest `executionId`。
- Summary 中显示 `Open Timeline` 按钮。
- 点击后切换到 Observability tab，并选中对应 execution。

## 安全要求

不得展示：

- prompt。
- answer。
- document content。
- token 原文。
- API key。
- password。
- 完整连接串。

Metadata 展示必须：

- 屏蔽敏感 key。
- 长字符串截断。
- 对未知对象做浅层摘要。

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

额外静态检查：

```bash
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```

Smoke：

```text
1. 打开首页。
2. 未登录进入 Observability tab。
3. readiness / metrics 可见。
4. 登录。
5. 运行 Agent Debug。
6. 点击 Open Timeline。
7. timeline 展示当前 execution。
8. metadata 不泄露 prompt / answer / document content。
```

## 输出

完成后输出：

1. 新增文件。
2. 修改文件。
3. Observability Workbench 设计。
4. Execution Timeline 集成说明。
5. 验证结果。
