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
- TASK-014 Reranker Context Optimization
- TASK-015 LLM Chat Completion Pipeline
- TASK-016 Conversation & Message Domain
- TASK-017 Hierarchical Memory System

当前边界：已实现 Knowledge Space、Document 元数据、对象存储、Document 上传编排、Document 解析、Markdown 分块、Chunk 向量化、Hybrid Retrieval、RRF 融合、Reranker 重排、Context token 裁剪、LLM Chat Completion、Conversation/Message 持久化和三层 Memory；尚未实现 Agent、LangGraph、Knowledge Graph 或 Tool Calling。

## 目录结构

```text
apps/backend/src/
|-- common/request-context/
|-- config/
|-- infrastructure/
|   |-- prisma/
|   |-- redis/
|   |-- storage/
|   `-- vector/
|-- modules/
|   |-- auth/
|   |-- chat/
|   |   |-- prompt/
|   |   |-- providers/
|   |   |-- chat.controller.ts
|   |   |-- chat.module.ts
|   |   |-- chat.service.ts
|   |   |-- chat.types.ts
|   |   `-- index.ts
|   |-- chunk/
|   |   `-- splitters/
|   |-- conversation/
|   |   |-- dto/
|   |   |-- entities/
|   |   |-- conversation.controller.ts
|   |   |-- conversation.module.ts
|   |   |-- conversation.repository.ts
|   |   |-- conversation.service.ts
|   |   |-- conversation.types.ts
|   |   `-- index.ts
|   |-- document/
|   |-- document-processing/
|   |   `-- parsers/
|   |-- embedding/
|   |   `-- providers/
|   |-- knowledge-space/
|   |-- memory/
|   |   |-- providers/
|   |   |   |-- mem0.provider.ts
|   |   |   `-- redis-memory.provider.ts
|   |   |-- memory.controller.ts
|   |   |-- memory.module.ts
|   |   |-- memory.repository.ts
|   |   |-- memory.service.ts
|   |   |-- memory.types.ts
|   |   `-- index.ts
|   |-- reranker/
|   |   |-- providers/
|   |   |   |-- bge-reranker.provider.ts
|   |   |   `-- reranker.provider.ts
|   |   |-- reranker.module.ts
|   |   |-- reranker.service.ts
|   |   |-- reranker.types.ts
|   |   `-- index.ts
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

数据访问链路：

```text
Controller -> Service -> Repository -> PrismaService -> Prisma Client -> DB
```

向量化链路：

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
-> VectorRetriever + KeywordRetriever
-> RrfFusion
-> RerankerService
-> ContextBuilder
```

Reranker 链路：

```text
RerankerService
-> RerankerProvider
-> BGE compatible HTTP endpoint
```

Chat 链路：

```text
ChatController
-> ChatService
-> MemoryService
-> ConversationService
-> RetrievalService
-> PromptBuilder
-> LlmProvider
-> OpenAI compatible HTTP endpoint
```

约束：

- Prisma 只存在于 infrastructure 层，业务 Service 不直接调用 Prisma。
- EmbeddingService 不直接调用模型 SDK，只依赖 `EmbeddingProvider`。
- RerankerService 不直接调用 HTTP，只依赖 `RerankerProvider`。
- ChatService 不直接调用 HTTP 或模型 SDK，只依赖 `LlmProvider`。
- ConversationService 不直接访问 Prisma，只依赖 `ConversationRepository`。
- MemoryService 不直接访问 Redis、Mem0 HTTP 或 Prisma，只依赖 MemoryProvider / MemoryRepository。
- Keyword Retrieval 使用 PostgreSQL Full Text Search，不引入 Elasticsearch。
- 当前阶段不实现 Agent、LangGraph、Knowledge Graph 或 Tool Calling。
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

Reranker 配置：

```text
RERANKER_API_URL
RERANKER_API_KEY
RERANKER_MODEL
```

LLM 配置：

```text
LLM_API_URL
LLM_API_KEY
LLM_MODEL
LLM_TEMPERATURE
LLM_MAX_TOKENS
```

Memory 配置：

```text
REDIS_MEMORY_TTL
MEMORY_WINDOW_SIZE
MEM0_API_URL
MEM0_API_KEY
```

## Retrieval Pipeline

内部服务方法：

```ts
retrieve(context, { query, limit, vectorLimit, keywordLimit, maxContextTokens });
```

流程：

```text
Query
-> VectorRetriever + KeywordRetriever
-> RRF
-> Reranker
-> Context Builder
-> ContextChunk[]
```

返回：

```ts
interface ContextChunk {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
}
```

权限过滤：

```text
roles
permissions: knowledge.retrieve 或 knowledge.read
spaceIds
```

没有可访问 `spaceIds`、没有角色、或没有知识检索权限时，检索结果为空。Retriever 查询也会按 `spaceIds` 限制 Document 所属 Space，避免无权限 Chunk 进入结果。

## RRF

RRF 融合公式：

```text
score(d) = sum(1 / (60 + rank))
```

输入为 vector results 和 keyword results，输出去重后的候选 Chunk。

## Reranker

接口：

```ts
interface RerankerProvider {
  rerank(query: string, documents: RerankDocument[]): Promise<RerankScore[]>;
}
```

第一版 Provider 为 BGE/OpenAI-compatible HTTP 风格：

```text
POST RERANKER_API_URL
Authorization: Bearer RERANKER_API_KEY
body: { model, query, documents }
```

Reranker 输出的 score 会替换 RRF score，并按 score 降序排列。

## Context 优化

`ContextBuilder` 提供 `buildContextChunks()`：

```text
MAX_CONTEXT_TOKENS = 3000
```

规则：

```text
1. 按 reranker score 降序
2. 依次加入 chunk
3. 如果加入下一个 chunk 会超过 token 预算，则停止
4. 输出 ContextChunk[]
```

`retrieve()` 可通过 `maxContextTokens` 覆盖默认预算。

## Chat Pipeline

API：

```text
POST /chat/:conversationId
POST /chat/:conversationId/stream
```

内部流程：

```text
Question
-> Conversation ownership check
-> MemoryService.getMemory()
-> save USER Message
-> RetrievalService
-> ContextChunk[]
-> PromptBuilder(Memory + Summary + History + Knowledge Context + Question)
-> LlmProvider
-> save ASSISTANT Message
-> MemoryService.saveTurn()
-> Answer
```

Prompt 由 `PromptBuilder` 统一生成：

```text
System: 你是企业知识助手。只能依据Context回答。

User:
Memory Context:
{long-term facts + Redis short-term memory}

Summary:
{conversation summary}

History:
{previous messages}

Knowledge Context:
{context}

Question:
{question}
```

`/chat/:conversationId` 返回：

```ts
interface ChatResponse {
  answer: string;
  citations: ChatCitation[];
}
```

`/chat/:conversationId/stream` 使用 SSE 输出 token：

```text
data: {"token":"..."}

data: [DONE]
```

未来 Memory / Agent 只能在 Chat 之后作为独立编排层接入，继续消费 `RetrievalService`、`PromptBuilder` 和 `LlmProvider`，不应污染 Retrieval / Reranker / Repository 边界。

## Conversation Domain

API：

```text
POST /conversations
GET /conversations
GET /conversations/:id
DELETE /conversations/:id
GET /conversations/:id/messages
```

数据模型：

```text
User 1:N Conversation 1:N Message
```

`DELETE /conversations/:id` 为软删除，将 Conversation.status 置为 `DELETED`。所有 Conversation 与 Message 查询都以当前 JWT 用户为边界，用户只能访问自己的会话。

## Memory System

三层 Memory：

```text
Redis Short-term Memory
-> Conversation Summary Memory
-> Mem0 Long-term Memory
```

Redis key：

```text
memory:conversation:{conversationId}
memory:summary:{conversationId}
```

Short-term memory 使用 sliding window，默认保存最近 `MEMORY_WINDOW_SIZE` 轮对话消息。Message 超过 20 条后由 `LlmProvider` 生成 summary，并写入 Redis summary key。

Mem0 只保存用户事实，不保存完整 Conversation。API：

```text
GET /memory?query=...
DELETE /memory/:id
```

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
