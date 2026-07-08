# TASK-037：Execution Trace Store & Timeline API

## 目标

把 Agent 执行过程从临时 SSE 事件升级为可查询、可回放、可解释的持久化 Execution Timeline。

本任务服务于：

- Agent Debug 面板刷新后仍能查询历史执行。
- 面试演示时能解释每次 Agent 执行路径。
- 后续 Metrics Breakdown、Observability Workbench 和线上排错。

## 禁止项

- 不记录完整 prompt。
- 不记录完整 answer。
- 不记录 document content。
- 不记录 token 原文。
- 不记录文件正文或二进制内容。
- Controller 不访问 Prisma。
- Agent Node 不访问 Prisma。
- 不引入 LangSmith 或外部 APM。
- 不重构现有 ObservabilityService。
- 不合并 PipelineJob/PipelineEvent。

## 数据库

新增 Prisma 模型：

```text
ExecutionRun
ExecutionTraceEvent
```

`ExecutionRun` 表示一次 Agent workflow。

`ExecutionTraceEvent` 表示 workflow 中的节点、阶段或关键事件。

状态：

```text
ExecutionRunStatus:
RUNNING
SUCCEEDED
FAILED

ExecutionTraceEventStatus:
STARTED
SUCCEEDED
FAILED
SKIPPED
```

## 后端目录

新增：

```text
apps/backend/src/modules/execution/
├── execution.module.ts
├── execution.controller.ts
├── execution.service.ts
├── execution.repository.ts
├── execution.types.ts
├── dto/
├── entities/
└── index.ts
```

## API

```text
GET /executions
GET /executions/:executionId
GET /executions/:executionId/timeline
```

权限规则：

- 必须登录。
- 用户只能查询自己的 execution。
- Admin 扩展暂不实现。

## Agent 集成

流程：

```text
AgentService
-> create ExecutionRun
-> AgentGraph append ExecutionTraceEvent
-> AgentService finish ExecutionRun
```

记录事件类型：

```text
workflow
memory
planner
retrieval
graph
answer
verification
iteration
error
```

metadata 只允许保存：

```text
count
latency
status
needsRetrieval
needsGraph
needsMoreContext
iteration
maxIterations
verified
reason
```

## 验收标准

- `ExecutionRun` 能记录成功和失败执行。
- `ExecutionTraceEvent` 能按 sequence 查询。
- `/executions/:executionId` 只能返回当前用户自己的执行。
- `/executions/:executionId/timeline` 不返回敏感正文。
- Agent SSE 行为保持兼容。
- PipelineJob/PipelineEvent 不受影响。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
