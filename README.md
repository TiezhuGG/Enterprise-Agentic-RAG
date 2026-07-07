# Enterprise Agentic RAG

Enterprise Agentic RAG 是面向企业级 Agentic RAG 系统的 monorepo 工程骨架。

当前已完成：

- TASK-001 Monorepo 结构初始化
- TASK-002 统一配置系统与环境策略
- TASK-003 Prisma 与数据库访问层
- TASK-004 JWT 认证系统
- TASK-005 面向知识检索的轻量 RBAC
- TASK-006 Enterprise Knowledge Space
- TASK-007 Knowledge Document Domain
- TASK-008 Object Storage Layer
- TASK-009 Document Upload Pipeline
- TASK-010 Document Processing Pipeline
- TASK-011 Semantic Chunking Pipeline
- TASK-012 Embedding Pipeline
- TASK-013 Hybrid Retrieval Engine

当前边界：已实现 Knowledge Space、Document 元数据、对象存储、Document 上传编排、Document 解析流水线、Markdown 语义分块、Chunk 向量化和 Hybrid Retrieval；尚未实现 Agent、LangGraph、Answer Generation、Reranker 或 Elasticsearch。

## 目录结构

```text
apps/backend/src/
|-- common/request-context/
|-- config/
|-- infrastructure/
|   |-- prisma/
|   |-- storage/
|   `-- vector/
|-- modules/
|   |-- auth/
|   |-- chunk/
|   |   `-- splitters/
|   |-- document/
|   |-- document-processing/
|   |   `-- parsers/
|   |-- embedding/
|   |   `-- providers/
|   |-- knowledge-space/
|   |-- retrieval/
|   |   |-- context/
|   |   |   `-- context.builder.ts
|   |   |-- fusion/
|   |   |   `-- rrf.fusion.ts
|   |   |-- retrievers/
|   |   |   |-- keyword.retriever.ts
|   |   |   `-- vector.retriever.ts
|   |   |-- retrieval.module.ts
|   |   |-- retrieval.service.ts
|   |   |-- retrieval.types.ts
|   |   `-- index.ts
|   |-- upload/
|   `-- user/
|-- app.module.ts
`-- main.ts
```

## 架构边界

数据库访问链路：

```text
Controller -> Service -> Repository -> PrismaService -> Prisma Client -> DB
```

对象存储链路：

```text
Business Module -> StorageService -> StorageClient -> MinIO Client
```

向量化流水线：

```text
EmbeddingService
-> ChunkRepository
-> EmbeddingProvider
-> VectorService
-> VectorClient
-> DB
```

检索链路：

```text
RetrievalService
-> ContextBuilder
-> VectorRetriever / KeywordRetriever
-> VectorService / ChunkRepository
-> RrfFusion
```

约束：

- Prisma 只存在于 infrastructure 层，业务 Service 不直接调用 Prisma。
- MinIO SDK 只存在于 `apps/backend/src/infrastructure/storage/storage.client.ts`。
- EmbeddingService 不直接调用模型 SDK，只依赖 `EmbeddingProvider` 接口。
- RetrievalService 不直接访问 Prisma。
- Keyword Retrieval 使用 PostgreSQL Full Text Search，不引入 Elasticsearch。
- Retrieval 阶段不实现 Agent、LangGraph、Answer Generation、Reranker 或 Elasticsearch。
- 所有环境变量必须通过后端 `ConfigService` 或前端 `lib/env.ts` 访问。

## 配置

后端配置统一从 `ConfigService` 获取，并通过 zod 做启动前校验。

Embedding 配置：

```text
EMBEDDING_API_URL
EMBEDDING_API_KEY
EMBEDDING_MODEL
EMBEDDING_DIMENSION
```

## 数据模型

已实现模型：

```text
User
Role
Permission
UserRole
RolePermission
KnowledgeSpace
SpaceMember
Document
DocumentContent
Chunk
ChunkEmbedding
```

`Chunk` 保存从 DocumentContent 切分出的语义块，和 Document 多对一。

```text
Chunk
- id
- documentId
- content
- sequence
- tokenCount
- metadata
- createdAt
- updatedAt
```

`ChunkEmbedding` 保存 Chunk 的向量化结果，和 Chunk 一对一。

```text
ChunkEmbedding
- id
- chunkId
- model
- dimension
- vector
- createdAt
- updatedAt
```

关系：

- `Document.spaceId -> KnowledgeSpace.id`
- `DocumentContent.documentId -> Document.id`
- `Chunk.documentId -> Document.id`
- `ChunkEmbedding.chunkId -> Chunk.id`
- `Chunk` 通过 `(documentId, sequence)` 保证同一文档内顺序唯一
- `ChunkEmbedding.chunkId` 唯一，保证每个 Chunk 当前只有一份 embedding

## Chunk Pipeline

内部服务方法：

```ts
processChunks(documentId);
```

处理流程：

```text
1. 读取 DocumentContent.content
2. 删除旧 Chunk
3. Markdown Header Split
4. Token Split
5. 计算 token 数量
6. 生成 metadata
7. 批量保存 Chunk
```

默认分块参数：

```text
chunkSize = 500 tokens
overlap = 100 tokens
```

## Embedding Pipeline

内部服务方法：

```ts
processEmbedding(documentId);
```

处理流程：

```text
1. 查询 Document 下所有 Chunk
2. 删除旧 ChunkEmbedding
3. 调用 EmbeddingProvider.embed(chunk.content)
4. 校验 vector 长度和数值
5. 保存 ChunkEmbedding
```

Provider 接口：

```ts
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}
```

## Retrieval Engine

内部服务方法：

```ts
retrieve(context, { query, limit, vectorLimit, keywordLimit });
```

输入：

```text
用户 query
KnowledgeRequestContext / ExecutionContext
```

输出：

```ts
interface RetrievalResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
}
```

权限过滤：

```text
ContextBuilder
-> roles
-> permissions: knowledge.retrieve 或 knowledge.read
-> spaceIds
```

没有可访问 `spaceIds`、没有角色、或没有知识检索权限时，检索结果为空。Retriever 查询时也会按 `spaceIds` 限制 Document 所属 Space，避免无权限 Chunk 进入结果。

Vector Retrieval：

```text
Query
-> EmbeddingProvider
-> VectorService.searchSimilar()
-> Candidate Chunks
```

当前向量相似度在 `VectorClient` 内基于 PostgreSQL 已保存的 `DOUBLE PRECISION[]` 计算 cosine similarity。后续切换 pgvector 时应集中替换 `VectorClient` 和 migration。

Keyword Retrieval：

```text
Query
-> PostgreSQL Full Text Search
-> Candidate Chunks
```

FTS 使用：

```text
websearch_to_tsquery('simple', query)
to_tsvector('simple', chunks.content)
GIN index: chunks_content_fts_idx
```

RRF 融合：

```text
score(d) = sum(1 / (60 + rank))
```

输入为 vector results 和 keyword results，输出去重后的 Relevant Chunks。

## 后续 Reranker 接入

Reranker 后续应插在 RRF 之后、Answer Generation 之前：

```text
RetrievalService
-> VectorRetriever + KeywordRetriever
-> RrfFusion
-> Reranker
-> Context Pack
```

本阶段不实现 Reranker、Answer Generation、Agent、LangGraph 或 Elasticsearch。

## 启动方式

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm dev:backend
pnpm dev:frontend
```

常用检查：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

seed 管理员账号：

```text
email: admin@example.com
password: Admin123!
```
