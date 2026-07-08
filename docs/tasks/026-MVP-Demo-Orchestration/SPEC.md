# TASK-026 MVP Demo Orchestration

## 目标

在不继续扩展大功能的前提下，把当前已经完成的 RAG / GraphRAG / Memory / Agent / Streaming UI 能力串成一条可部署、可验证、可演示的 MVP 闭环。

本任务重点不是新增算法，而是补齐演示闭环：

```text
上传企业文档
-> Document PROCESSING
-> DocumentContent
-> Chunk
-> ChunkEmbedding
-> Knowledge Graph
-> Document READY
-> Agent Chat Stream
-> Answer + Citations + Trace
```

## 背景

当前项目已经完成：

- Document Upload
- StorageService / MinIO
- Document Processing
- Chunking
- Embedding
- Hybrid Retrieval
- Reranker
- Knowledge Graph
- Memory
- Agent API
- SSE Streaming UI
- Observability
- Evaluation
- Deployment Packaging
- Multimodal Attachment 入口

但这些能力仍然偏“模块级完成”。MVP 演示需要一个统一入口，把文档从上传后的 `PROCESSING` 状态推进到“可被 Agent 检索和引用”的完整状态。

## 范围

新增后端模块：

```text
apps/backend/src/modules/ingestion/
├── dto/
│   ├── ingest-document.dto.ts
│   └── ingest-space.dto.ts
├── ingestion.controller.ts
├── ingestion.module.ts
├── ingestion.repository.ts
├── ingestion.service.ts
├── ingestion.types.ts
└── index.ts
```

新增 Demo 文档与脚本：

```text
docs/demo/
├── DEMO_SCRIPT.md
├── PROVIDER_SMOKE.md
└── sample-policy.md
```

可选新增脚本入口：

```text
apps/backend/src/modules/ingestion/run-demo-ingest.ts
apps/backend/src/modules/ingestion/run-demo-smoke.ts
```

根 `package.json` 或 backend `package.json` 增加脚本：

```text
pnpm demo:ingest
pnpm demo:smoke
```

## 不做什么

- 不新增 OCR / ASR / Video Understanding。
- 不新增 Elasticsearch。
- 不把 PostgreSQL `Float[]` 改造成 pgvector。
- 不引入 BullMQ / Temporal / Celery 等异步任务系统。
- 不新增复杂前端后台。
- 不新增 Kubernetes。
- 不在 Controller / script 中直接访问 Prisma、MinIO、Neo4j、Redis 或模型 Provider。
- 不记录完整 prompt、answer、document content 到日志。
- 不硬编码任何 API Key、数据库、Redis、MinIO、Neo4j 或模型配置。

## API 设计

### 1. 单文档入库

```text
POST /documents/:id/ingest
```

请求：

```ts
interface IngestDocumentDto {
  force?: boolean;
  includeEmbedding?: boolean;
  includeGraph?: boolean;
}
```

默认策略：

- `force=false`
- `includeEmbedding=true`
- `includeGraph=true`

响应：

```ts
interface IngestionResult {
  documentId: string;
  spaceId: string;
  status: 'READY' | 'FAILED';
  readyForRetrieval: boolean;
  stages: IngestionStageResult[];
  counts: {
    chunks: number;
    embeddings: number;
    graphEntities?: number;
    graphRelations?: number;
  };
}
```

### 2. 文档入库状态

```text
GET /documents/:id/ingest/status
```

响应：

```ts
interface IngestionStatus {
  documentId: string;
  spaceId: string;
  documentStatus: DocumentStatus;
  hasContent: boolean;
  chunkCount: number;
  embeddingCount: number;
  graphEntityCount?: number;
  graphRelationCount?: number;
  readyForRetrieval: boolean;
}
```

### 3. Space 批量入库

```text
POST /spaces/:spaceId/ingest
```

请求：

```ts
interface IngestSpaceDto {
  force?: boolean;
  includeEmbedding?: boolean;
  includeGraph?: boolean;
  documentIds?: string[];
}
```

用途：

- Demo 快速初始化。
- 服务器部署后对样例知识库一键构建索引。
- 避免手动逐个调用处理接口。

## IngestionService

`IngestionService` 是本任务的核心编排层。

依赖关系必须保持：

```text
IngestionController
-> IngestionService
-> DocumentRepository / IngestionRepository
-> DocumentProcessingService
-> ChunkService
-> EmbeddingService
-> KnowledgeGraphService
-> ObservabilityService
```

禁止：

```text
IngestionController -> Prisma
IngestionController -> MinIO
IngestionController -> Neo4j
IngestionController -> Redis
IngestionController -> Provider
IngestionService -> Prisma
IngestionService -> MinIO SDK
IngestionService -> Neo4j SDK
IngestionService -> HTTP 模型接口
```

## 状态策略

现有 `DocumentStatus` 继续复用：

```text
CREATED
PROCESSING
READY
FAILED
ARCHIVED
```

本任务不新增数据库状态枚举。

推荐解释：

- `PROCESSING`：文档正在进入知识库索引链路。
- `READY`：文档已经完成内容解析、Chunk、Embedding，并可被检索。
- `FAILED`：任一关键阶段失败。

注意：

当前 `DocumentProcessingService.processDocument()` 会在生成 `DocumentContent` 后把 Document 更新为 `READY`。TASK-026 实现时需要由 `IngestionService` 在后续 Chunk / Embedding / Graph 阶段失败时重新将 Document 标记为 `FAILED`，保证最终状态可信。

## Stage 设计

```ts
type IngestionStage =
  'validate' | 'document-processing' | 'chunking' | 'embedding' | 'graph-extraction' | 'done';

type IngestionStageStatus = 'success' | 'failed' | 'skipped';

interface IngestionStageResult {
  stage: IngestionStage;
  status: IngestionStageStatus;
  durationMs: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}
```

## 权限

入库属于写操作。

允许 Space 角色：

```text
OWNER
EDITOR
```

不允许：

```text
VIEWER
```

权限判断必须基于当前 `ExecutionContext` 和 Knowledge Space membership。

## 真实服务接入原则

本任务不新增新的 Provider 类型，但必须让 Demo Smoke 使用真实配置：

- `LLM_API_URL`
- `LLM_API_KEY`
- `LLM_MODEL`
- `EMBEDDING_API_URL`
- `EMBEDDING_API_KEY`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSION`
- `RERANKER_API_URL`
- `RERANKER_API_KEY`
- `RERANKER_MODEL`
- `NEO4J_URI`
- `REDIS_URL`
- `MINIO_ENDPOINT`

Smoke 失败时必须显式失败，不允许静默 fallback 到 mock。

Smoke 输出不得包含 API Key。

## Demo 验收链路

最终 Demo 必须能说明：

```text
1. 登录
2. 创建或使用 seed Space
3. 上传 sample-policy.md / PDF / DOCX
4. 调用 /documents/:id/ingest
5. 查询 /documents/:id/ingest/status
6. 创建 Conversation
7. 调用 /agent/chat/stream
8. 看到 token streaming
9. 看到 citations
10. 看到 trace
11. /metrics 中出现 ingestion / retrieval / agent 指标
```

## 验收标准

- `POST /documents/:id/ingest` 可以完成单文档完整入库。
- `POST /spaces/:spaceId/ingest` 可以批量处理 Space 下文档。
- 入库流程复用现有服务，不破坏 DDD 分层。
- 失败时 Document 最终状态为 `FAILED`。
- 成功时 Document 最终状态为 `READY`。
- `GET /documents/:id/ingest/status` 返回 content/chunk/embedding/graph 状态。
- Demo sample 文档可被解析、分块、向量化、图谱抽取。
- Agent 能基于 Demo 文档返回有 citation 的流式回答。
- Smoke 文档说明真实服务配置检查结果。
- 通过：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
