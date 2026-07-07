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

当前边界：已实现 Knowledge Space、Document 元数据、对象存储、Document 上传编排、Document 解析流水线、Markdown 语义分块和 Chunk 向量化；尚未实现 Retrieval、Search API、BM25、Elasticsearch、Reranker 或 Agent。

## 目录结构

```text
apps/backend/src/
|-- common/request-context/
|-- config/
|-- infrastructure/
|   |-- prisma/
|   |-- storage/
|   `-- vector/
|       |-- vector.client.ts
|       |-- vector.module.ts
|       |-- vector.service.ts
|       |-- vector.types.ts
|       `-- index.ts
|-- modules/
|   |-- auth/
|   |-- chunk/
|   |   `-- splitters/
|   |-- document/
|   |-- document-processing/
|   |   `-- parsers/
|   |-- embedding/
|   |   |-- providers/
|   |   |   |-- embedding.provider.ts
|   |   |   `-- openai-compatible.provider.ts
|   |   |-- embedding.module.ts
|   |   |-- embedding.service.ts
|   |   |-- embedding.types.ts
|   |   `-- index.ts
|   |-- knowledge-space/
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

解析流水线：

```text
DocumentProcessingService
-> DocumentRepository
-> StorageService
-> ParserFactory
-> DocumentParser
-> DocumentRepository
```

分块流水线：

```text
ChunkService
-> ChunkRepository
-> PrismaService
-> DB
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

约束：

- Prisma 只存在于 infrastructure 层，业务 Service 不直接调用 Prisma。
- MinIO SDK 只存在于 `apps/backend/src/infrastructure/storage/storage.client.ts`。
- 业务模块不直接依赖 MinIO SDK 或 pgvector。
- EmbeddingService 不直接调用模型 SDK，只依赖 `EmbeddingProvider` 接口。
- Embedding Pipeline 不实现 Retrieval、Search API、BM25、Elasticsearch、Reranker 或 Agent。
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

`EMBEDDING_API_URL` 使用 OpenAI-compatible embeddings endpoint，例如：

```text
http://localhost:11434/v1/embeddings
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

`DocumentContent` 保存解析后的 Markdown 内容，和 Document 一对一。

```text
DocumentContent
- id
- documentId
- content
- createdAt
- updatedAt
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

## Processing Pipeline

内部服务方法：

```ts
processDocument(documentId);
```

处理流程：

```text
1. 读取 Document
2. 校验 Document.status = PROCESSING
3. 获取 storageKey
4. StorageService.getObject(storageKey)
5. ParserFactory 根据 Document.type 选择 Parser
6. Parser 生成 Markdown
7. DocumentRepository.upsertContent(documentId, markdown)
8. Document.status = READY
```

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

Chunk metadata：

```json
{
  "documentId": "document-id",
  "sequence": 1,
  "sectionTitle": "Section title"
}
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

第一版 Provider 为 OpenAI-compatible：

```text
POST EMBEDDING_API_URL
Authorization: Bearer EMBEDDING_API_KEY
body: { model, input }
```

Vector infrastructure：

```text
VectorService
-> VectorClient
-> ChunkEmbedding persistence
```

当前 `vector` 使用 PostgreSQL `DOUBLE PRECISION[]` 存储。后续切换到 pgvector 时，应集中替换 `VectorClient` 和迁移，不让业务模块直接依赖 pgvector。

## 后续 Retrieval 接入

Retrieval 后续应从 `ChunkEmbedding` 和 `Chunk` 读取：

```text
Query
-> QueryEmbeddingProvider
-> VectorService
-> Candidate ChunkEmbedding
-> Chunk
-> Permission Filter
-> Reranker
```

本阶段不暴露 Search API，不实现 BM25、Elasticsearch、Reranker 或 Agent。

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
