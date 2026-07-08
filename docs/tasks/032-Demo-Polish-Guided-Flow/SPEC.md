# TASK-032：Demo Polish & Guided MVP Flow

## 目标

TASK-032 做 MVP 演示闭环打磨。

当前前端已经具备 Pipeline Workbench 和 Agent Debug Workbench，但演示时仍需要讲解者手动说明系统是否就绪、下一步应该做什么、空状态代表什么。TASK-032 通过 System Readiness、Demo Guide、Checklist、示例问题和更清晰的空状态，把演示路径收敛为：

```text
System Ready -> Auth -> Space -> Upload -> Ingest -> Agent Debug -> Assistant
```

## 范围

新增：

```text
docs/tasks/032-Demo-Polish-Guided-Flow/
├── SPEC.md
├── SEQUENCE.md
├── ADR.md
├── REVIEW.md
└── CODEX.md

apps/frontend/types/demo.ts
apps/frontend/services/system.service.ts
apps/frontend/store/demo.store.ts
apps/frontend/components/demo/
```

修改：

```text
apps/frontend/components/workbench/DemoWorkbench.tsx
apps/frontend/components/agent-debug/AgentDebugWorkbench.tsx
apps/frontend/app/globals.css
```

## 复用 API

只复用现有后端 API：

```text
GET /health
GET /metrics
```

禁止新增后端 API。

## Readiness

`systemService.getReadiness()` 聚合：

- `/health`
- `/metrics`

Metrics 第一版只解析关键指标是否出现：

- `agent_workflows_total`
- `retrieval_requests_total`
- `llm_requests_total`
- `ingestion_requests_total`
- `document_processing_total`

不实现完整 Prometheus UI。

## 前端状态

新增：

```text
apps/frontend/store/demo.store.ts
```

保存：

- `health`
- `metricsSummary`
- `readiness`
- `loading`
- `error`
- `lastCheckedAt`

## UI 组件

新增：

```text
components/demo/
├── DemoGuidePanel.tsx
├── SystemReadinessPanel.tsx
├── DemoChecklist.tsx
├── DemoQuestionBank.tsx
└── DemoEmptyState.tsx
```

## 页面行为

- Workbench sidebar 显示 `SystemReadinessPanel`。
- Workbench 主区域顶部显示紧凑 `DemoGuidePanel`。
- `Pipeline / Agent Debug / Assistant` 三个 tab 保持不变。
- Checklist 展示短状态和下一步，不写长篇教程。
- Agent Debug 增加 `DemoQuestionBank`。
- 点击示例问题只填充 question，不自动请求 API。

## 空状态

统一增强：

- Space 未选择：显示最小操作状态。
- Document 为空：提示上传 sample policy。
- Pipeline events 为空：提示等待 ingest 或选择已有 job。
- Metadata 为空：提示需要 processing 完成。
- Agent Debug 无 conversation / 无 events / 无 citations：显示明确状态。
- API error：统一短错误样式，不展示 secret、prompt、完整正文。

## 禁止项

- 不新增后端 API。
- 不修改 AgentGraph / Node 编排逻辑。
- 不实现图可视化。
- 不实现权限管理。
- 不实现文档编辑。
- 不实现 Agent 能力升级。
- 不展示完整 prompt。
- 不展示 Memory 原文。
- 不展示完整 DocumentContent。
- React 组件不得直接 `fetch`。

## 验收标准

- 首页可看到 `Pipeline / Agent Debug / Assistant`。
- System readiness 能显示 `/health` 状态。
- `/metrics` 失败时显示短错误。
- 未登录或无 token 时 checklist 有 blocked 状态。
- 创建或选择 Space 后 checklist 更新。
- 上传文档后 checklist 更新。
- Ingest 完成后 Timeline 和 Metadata 空状态消失。
- Agent Debug 示例问题可填充 question。
- Citation / metadata / pipeline 不展示完整文档正文。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
