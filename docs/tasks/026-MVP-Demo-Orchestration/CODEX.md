# TASK-026 Codex Prompt

你是 Enterprise Agentic RAG 项目的后端架构工程师。

当前目标不是继续扩展大功能，而是基于现有代码实现可部署、可演示的 MVP 全链路闭环。

## 必须先阅读

编码前必须阅读：

```text
docs/tasks/026-MVP-Demo-Orchestration/SPEC.md
docs/tasks/026-MVP-Demo-Orchestration/SEQUENCE.md
docs/tasks/026-MVP-Demo-Orchestration/ADR.md
docs/tasks/026-MVP-Demo-Orchestration/REVIEW.md
docs/tasks/026-MVP-Demo-Orchestration/CODEX.md
```

## 当前背景

项目已经存在：

- Document Upload
- StorageService / MinIO
- DocumentProcessingService
- ChunkService
- EmbeddingService
- KnowledgeGraphService
- RetrievalService
- AgentService
- ObservabilityService
- Deployment packaging
- Assistant Streaming UI

现在缺少的是一个统一入库编排入口，让上传后的 Document 可以被稳定推进到可检索、可引用、可演示的状态。

## 目标

实现：

```text
Document
-> DocumentContent
-> Chunk
-> ChunkEmbedding
-> Knowledge Graph
-> READY
-> Agent Chat Stream
```

并提供 Demo 文档与 Smoke 步骤。

## 新增模块

创建：

```text
apps/backend/src/modules/ingestion/
```

包含：

```text
dto/
  ingest-document.dto.ts
  ingest-space.dto.ts
ingestion.controller.ts
ingestion.module.ts
ingestion.repository.ts
ingestion.service.ts
ingestion.types.ts
index.ts
```

## 新增文档

创建：

```text
docs/demo/
  DEMO_SCRIPT.md
  PROVIDER_SMOKE.md
  sample-policy.md
```

## API

实现：

```text
POST /documents/:id/ingest
GET /documents/:id/ingest/status
POST /spaces/:spaceId/ingest
```

## DTO

```ts
interface IngestDocumentDto {
  force?: boolean;
  includeEmbedding?: boolean;
  includeGraph?: boolean;
}
```

```ts
interface IngestSpaceDto {
  force?: boolean;
  includeEmbedding?: boolean;
  includeGraph?: boolean;
  documentIds?: string[];
}
```

## IngestionService 流程

```text
1. 校验 Document 存在
2. 校验当前用户是 Space OWNER 或 EDITOR
3. 校验 Document 有 storageKey
4. 校验 Document type 支持 parser
5. 设置 Document.status = PROCESSING
6. 调用 DocumentProcessingService.processDocument(documentId)
7. 调用 ChunkService.processChunks(documentId)
8. 调用 EmbeddingService.processEmbedding(documentId)
9. 如果 includeGraph=true，调用 KnowledgeGraphService.extractDocumentGraph(documentId)
10. 设置 Document.status = READY
11. 返回 IngestionResult
```

失败时：

```text
Document.status = FAILED
记录 stage error
抛出异常或返回失败结果
```

## 架构要求

必须：

```text
Controller
-> IngestionService
-> Existing Services / Repository
-> Infrastructure
```

禁止：

```text
Controller -> Prisma
Controller -> MinIO
Controller -> Redis
Controller -> Neo4j
Controller -> Provider
Service -> Prisma
Service -> MinIO SDK
Service -> Neo4j SDK
Service -> HTTP model API
```

## 权限

入库操作只允许：

```text
OWNER
EDITOR
```

拒绝：

```text
VIEWER
非 Space 成员
```

权限必须基于 `ExecutionContext`。

## Demo Script

`docs/demo/DEMO_SCRIPT.md` 必须说明：

```text
1. 启动 Docker 基础设施
2. 执行 migrate / seed
3. 启动 backend / frontend
4. 登录
5. 上传 sample-policy 文档
6. 调用 ingest API
7. 调用 /agent/chat/stream
8. 查看 answer / citations / trace
9. 查看 /metrics
```

## Provider Smoke

`docs/demo/PROVIDER_SMOKE.md` 必须说明如何验证：

- Postgres
- Redis
- MinIO
- Neo4j
- LLM
- Embedding
- Reranker
- Agent Stream

不允许输出 API Key。

## 验证

完成后必须执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

推荐执行：

```text
pnpm db:validate
pnpm demo:smoke
pnpm demo:ingest
```

如果某个命令由于缺少真实外部服务失败，必须明确说明失败原因和需要补充的环境变量。

## 输出

完成后输出：

- 修改文件列表
- 新增目录
- API 说明
- 入库流程说明
- Demo 使用方式
- Smoke 结果
- 验证命令结果
- 已知限制
- 后续建议
