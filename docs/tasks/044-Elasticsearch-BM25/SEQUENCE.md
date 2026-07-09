# TASK-044：流程设计

## Index 初始化流程

```text
SearchService.ensureIndex()
-> SearchClient.indexExists()
-> false
-> SearchClient.createIndex(mapping)
```

Mapping 只包含 chunk retrieval 需要的字段。

## Chunk 同步流程

```text
ChunkService.processChunks(documentId)
-> ChunkRepository.findDocumentContentByDocumentId(documentId)
-> ChunkRepository.deleteByDocumentId(documentId)
-> MarkdownHeaderSplitter
-> TokenSplitter
-> ChunkRepository.createMany(chunks)
-> SearchService.indexChunks(createdChunks)
-> return chunks
```

说明：

- DB 仍然是 chunk source of truth。
- Elasticsearch 是 keyword retrieval index。
- 同步失败会让 ingestion 暴露失败，不静默吞掉。

## Keyword Retrieval 正常流程

```text
RetrievalService
-> KeywordRetriever.retrieve(query, context, limit)
-> SearchService.searchChunks({
     query,
     spaceIds: context.spaceIds,
     limit
   })
-> Elasticsearch BM25
-> RetrieverResult[]
```

## Keyword Retrieval fallback 流程

```text
SearchService.searchChunks()
-> throws
-> KeywordRetriever checks ELASTICSEARCH_ENABLE_FALLBACK
-> ChunkRepository.searchByKeyword()
-> RetrieverResult[]
```

Fallback 条件：

- Elasticsearch 网络不可达。
- Index 不存在。
- Search request 返回非 2xx。

Fallback 不处理权限策略，权限过滤仍由 `RetrievalService` 的 access context 和后续 `AccessPolicyService` 负责。

## Reindex 流程

```text
pnpm --filter @enterprise-agentic-rag/backend search:reindex
-> Nest application context
-> SearchService.reindexAll()
-> ensureIndex()
-> ChunkRepository.listReadyChunksForSearch()
-> delete index chunks by document / optional full reset
-> bulk index chunks
-> print JSON summary
```

第一版不做后台 job，不做定时任务。

## Readiness 流程

```text
GET /health/readiness
-> ReadinessService
-> SearchService.healthCheck()
-> SearchClient.ping()
```

如果 Elasticsearch 不可用：

- `/health/readiness` 返回 degraded。
- `/health` 仍返回 ok。

## 错误流程

### Index 失败

```text
SearchClient request failed
-> SearchService throws safe error
-> ChunkService.processChunks throws
-> Ingestion stage chunking failed
-> Document status FAILED
```

### Search 失败且 fallback disabled

```text
KeywordRetriever
-> SearchService.searchChunks throws
-> rethrow
-> RetrievalService records failed retrieval
```

### Search 失败且 fallback enabled

```text
KeywordRetriever
-> SearchService.searchChunks throws
-> ChunkRepository.searchByKeyword
-> return PostgreSQL FTS results
```

## 安全要求

- 不在错误信息中输出 password。
- 不在 metrics/logs 中输出完整 chunk content。
- 查询必须带 `spaceIds` filter。
- Elasticsearch 返回结果仍要经过 RetrievalService 权限策略过滤。
