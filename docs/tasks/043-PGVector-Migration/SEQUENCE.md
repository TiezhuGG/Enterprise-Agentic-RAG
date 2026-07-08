# TASK-043：流程设计

## Migration 流程

```text
pnpm db:migrate
-> CREATE EXTENSION IF NOT EXISTS vector
-> ALTER chunk_embeddings.vector TYPE vector
-> CREATE ivfflat cosine index
```

如果数据库镜像不支持 pgvector：

```text
CREATE EXTENSION vector failed
-> migration failed
-> 用户需要切换到 pgvector/pgvector:pg16
```

## Embedding 写入流程

```text
EmbeddingService.processEmbedding(documentId)
-> ChunkRepository.listByDocumentId(documentId)
-> EmbeddingProvider.embed(chunk.content)
-> VectorService.saveChunkEmbeddings()
-> VectorClient.createMany()
-> INSERT vector literal :: vector
```

业务层不接触 SQL。

## Vector Search 流程

```text
VectorRetriever
-> EmbeddingProvider.embed(query)
-> VectorService.searchSimilar()
-> VectorClient.searchSimilar()
-> SQL cosine search
-> VectorSearchResult[]
```

SQL 层过滤：

- `dimension = queryVector.length`
- `document.status = READY`
- `document.space_id = ANY(spaceIds)`

RetrievalService 后续继续执行：

```text
AccessPolicy filter
-> RRF
-> Reranker
-> ContextBuilder
```

## Health / Readiness

```text
GET /health/readiness
-> VectorService.healthCheck()
-> VectorClient.healthCheck()
-> SELECT extname FROM pg_extension WHERE extname = 'vector'
```

extension 不存在时 readiness 返回 degraded。

## Fallback

本任务不保留 Node 内存 cosine fallback。

原因：

- fallback 会掩盖 pgvector 配置错误。
- 生产验收需要明确失败，而不是悄悄退回低效实现。
