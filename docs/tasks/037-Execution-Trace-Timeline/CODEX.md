# TASK-037：给 Codex 的实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请实现 Execution Trace Store & Timeline API。

必须严格遵守现有 DDD 分层：

```text
Controller
↓
Service
↓
Repository
↓
Prisma
```

## 必须先读

```text
docs/tasks/037-Execution-Trace-Timeline/SPEC.md
docs/tasks/037-Execution-Trace-Timeline/SEQUENCE.md
docs/tasks/037-Execution-Trace-Timeline/ADR.md
docs/tasks/037-Execution-Trace-Timeline/REVIEW.md
docs/tasks/037-Execution-Trace-Timeline/CODEX.md
```

## 目标

新增 ExecutionRun / ExecutionTraceEvent，持久化 Agent workflow timeline。

新增 API：

```text
GET /executions
GET /executions/:executionId
GET /executions/:executionId/timeline
```

Agent 执行时写入：

- run started
- node events
- verification events
- run succeeded / failed
- error event

## 禁止

- 不记录完整 prompt。
- 不记录完整 answer。
- 不记录完整 document content。
- 不记录 token 原文。
- 不让 Controller 访问 Repository。
- 不让 Controller 访问 Prisma。
- 不让 Agent Node 访问 Prisma。
- 不引入外部 APM。
- 不改现有 SSE 事件格式。

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:migrate
pnpm db:seed
```

如果本地数据库不可用，需要明确说明。
