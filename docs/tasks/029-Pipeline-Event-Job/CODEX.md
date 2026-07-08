# TASK-029：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请严格遵守 DDD 分层和现有目录结构，实现 Document Pipeline Event & Job Tracking。

## 必须先阅读

```text
docs/tasks/029-Pipeline-Event-Job/SPEC.md
docs/tasks/029-Pipeline-Event-Job/SEQUENCE.md
docs/tasks/029-Pipeline-Event-Job/ADR.md
docs/tasks/029-Pipeline-Event-Job/REVIEW.md
docs/tasks/029-Pipeline-Event-Job/CODEX.md
```

## 目标

将 Document Ingestion Pipeline 的执行过程持久化为：

```text
PipelineJob
PipelineEvent
```

让文档处理历史可以被查询、评估和展示。

## 新增模块

创建：

```text
apps/backend/src/modules/pipeline/
├── pipeline.module.ts
├── pipeline.controller.ts
├── pipeline.service.ts
├── pipeline.repository.ts
├── pipeline.types.ts
└── index.ts
```

## 数据库

修改：

```text
apps/backend/prisma/schema.prisma
```

新增：

```prisma
enum PipelineJobStatus {
  RUNNING
  SUCCEEDED
  FAILED
  CANCELED
}

enum PipelineEventStatus {
  STARTED
  SUCCEEDED
  FAILED
  SKIPPED
}
```

新增模型：

```text
PipelineJob
PipelineEvent
```

并新增 migration。

## API

新增：

```text
GET /documents/:documentId/pipeline/jobs
GET /pipeline/jobs/:jobId
GET /pipeline/jobs/:jobId/events
```

权限：

```text
OWNER / EDITOR / VIEWER
```

## Ingestion 集成

修改：

```text
apps/backend/src/modules/ingestion/
```

要求：

- Ingestion 开始时创建 Job。
- 每个阶段完成后写入 Event。
- 失败阶段写入 failed event 和 errorMessage。
- skipped 阶段写入 skipped event。
- 成功时 Job = `SUCCEEDED`。
- 失败时 Job = `FAILED`。
- `IngestionResult` 返回 `pipelineJobId`。

## Metadata 安全

Pipeline metadata 禁止保存：

- 正文
- prompt
- answer
- messages
- buffer
- token
- secret
- password
- authorization
- api key

允许保存 count、hash、language、model、reason、duration、status 等结构化信息。

## 架构要求

必须：

```text
Controller
↓
Service
↓
Repository
↓
Prisma
```

禁止：

- Controller 访问 Repository / Prisma。
- Service 直接访问 Prisma。
- 引入队列或后台 worker。
- 改写 Parser / Chunk / Embedding / Graph 核心逻辑。

## 验证

执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:migrate
pnpm db:seed
```

输出：

- 修改文件
- 新增目录
- 数据库设计
- Pipeline 设计
- API 说明
- 测试结果
- 后续前端工作台接入建议
