# TASK-029：Pipeline Event & Job Tracking

## 目标

TASK-029 负责将 Document Ingestion Pipeline 的执行过程持久化。

当前 Ingestion 只在接口返回里包含阶段结果，并通过 Observability 打结构化日志；一旦请求结束，前端、评估脚本和运维侧无法查询某个文档历史上经历过哪些处理阶段、每个阶段耗时、失败原因、是否跳过 Embedding 或 Graph。

本任务新增 Pipeline Job / Pipeline Event，让文档处理链路具备可查询的执行历史。

## 范围

新增：

```text
docs/tasks/029-Pipeline-Event-Job/
├── SPEC.md
├── SEQUENCE.md
├── ADR.md
├── REVIEW.md
└── CODEX.md

apps/backend/src/modules/pipeline/
├── pipeline.module.ts
├── pipeline.controller.ts
├── pipeline.service.ts
├── pipeline.repository.ts
├── pipeline.types.ts
└── index.ts
```

修改：

```text
apps/backend/prisma/schema.prisma
apps/backend/prisma/migrations/
apps/backend/src/app.module.ts
apps/backend/src/modules/ingestion/
```

## 数据库模型

新增 `PipelineJob`：

```prisma
model PipelineJob {
  id          String            @id @default(cuid())
  documentId  String            @map("document_id")
  spaceId     String            @map("space_id")
  executionId String?           @map("execution_id")
  requestId   String?           @map("request_id")
  triggeredBy String?           @map("triggered_by")
  status      PipelineJobStatus @default(RUNNING)
  metadata    Json              @default("{}")
  startedAt   DateTime          @default(now()) @map("started_at")
  finishedAt  DateTime?         @map("finished_at")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")
}
```

新增 `PipelineEvent`：

```prisma
model PipelineEvent {
  id           String              @id @default(cuid())
  jobId        String              @map("job_id")
  documentId   String              @map("document_id")
  spaceId      String              @map("space_id")
  stage        String
  status       PipelineEventStatus
  durationMs   Int?                @map("duration_ms")
  metadata     Json                @default("{}")
  errorMessage String?             @map("error_message")
  createdAt    DateTime            @default(now()) @map("created_at")
}
```

枚举：

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

## 阶段

沿用现有 Ingestion 阶段：

```text
validate
document-processing
chunking
embedding
graph-extraction
done
```

不新增新的业务阶段，不替换现有 Ingestion 流程。

## API

新增只读 API：

```text
GET /documents/:documentId/pipeline/jobs
GET /pipeline/jobs/:jobId
GET /pipeline/jobs/:jobId/events
```

权限：

```text
OWNER / EDITOR / VIEWER
```

用户只能查询自己可访问 Space 下的文档 Pipeline。

## Ingestion 返回增强

`IngestionResult` 新增：

```ts
pipelineJobId?: string;
```

这让 demo、前端工作台和 Evaluation 可以从一次 ingest 响应直接跳转到执行历史。

## Metadata 规则

允许记录：

- `force`
- `includeEmbedding`
- `includeGraph`
- `documentStatus`
- `documentType`
- `documentContentId`
- `contentHash`
- `sourceHash`
- `language`
- `cleaner`
- `chunkCount`
- `embeddingCount`
- `model`
- `graphEntities`
- `graphRelations`
- `reason`

禁止记录：

- 文档正文
- prompt
- answer
- token
- API key
- object buffer
- 用户密码或 Authorization header

## 架构规则

必须保持：

```text
Controller
↓
Service
↓
Repository
↓
Prisma
```

Ingestion 接入：

```text
IngestionService
↓
PipelineService
↓
PipelineRepository
↓
Prisma
```

禁止：

- Controller 访问 Repository / Prisma。
- PipelineService 直接访问 Prisma。
- PipelineEvent 记录正文内容。
- 引入队列、BullMQ、Kafka、Temporal。
- 改造成异步任务执行模型。
- 修改 Parser / Chunk / Embedding 的核心算法。

## 验收标准

- Ingestion 开始时创建 `PipelineJob`。
- 每个阶段完成时创建 `PipelineEvent`。
- 失败阶段写入 `FAILED` event 和 `errorMessage`。
- 跳过阶段写入 `SKIPPED` event。
- Ingestion 成功时 Job 状态为 `SUCCEEDED`。
- Ingestion 失败时 Job 状态为 `FAILED`。
- `GET /documents/:documentId/pipeline/jobs` 可查询历史 job。
- `GET /pipeline/jobs/:jobId` 返回 job 与 events。
- `GET /pipeline/jobs/:jobId/events` 返回事件时间线。
- 无权限用户不能读取跨 Space pipeline。
- 不破坏现有 Ingestion / Agent / Retrieval 流程。

## 验证命令

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
```

推荐执行：

```bash
pnpm db:migrate
pnpm db:seed
```

可选 Smoke：

```bash
pnpm demo:ingest <documentId> <userId> <spaceId> --force --no-graph
```
