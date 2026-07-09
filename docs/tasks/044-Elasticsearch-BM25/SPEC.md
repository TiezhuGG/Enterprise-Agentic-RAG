# TASK-044：Elasticsearch BM25

## 目标

将 keyword retrieval 从 PostgreSQL Full Text Search 升级为 Elasticsearch BM25。

本任务只替换关键词检索底座，不改变 Retrieval / RRF / Reranker / Agent 的外部行为。

最终链路：

```text
ChunkService
-> SearchService.indexChunks()
-> Elasticsearch

KeywordRetriever
-> SearchService.searchChunks()
-> Elasticsearch BM25
-> PostgreSQL FTS fallback
```

## 禁止项

- 不实现 Elasticsearch 管理后台。
- 不实现复杂 index lifecycle management。
- 不实现多 index alias 灰度切换。
- 不改 Vector Retrieval。
- 不改 RRF 算法。
- 不改 Reranker。
- 不改 Agent 编排。
- 不让 Controller / Service 直接访问 Elasticsearch。
- 不把 Elasticsearch HTTP 调用散落到业务模块。
- 不记录完整 query、chunk content 到日志或 metrics。

## 新增目录

```text
apps/backend/src/infrastructure/search/
├── index.ts
├── search.client.ts
├── search.module.ts
├── search.service.ts
└── search.types.ts
```

## 配置

新增环境变量：

```text
ELASTICSEARCH_URL
ELASTICSEARCH_INDEX
ELASTICSEARCH_USERNAME
ELASTICSEARCH_PASSWORD
ELASTICSEARCH_ENABLE_FALLBACK
```

说明：

- `ELASTICSEARCH_URL`：Elasticsearch HTTP 地址。
- `ELASTICSEARCH_INDEX`：chunk index 名称。
- `ELASTICSEARCH_USERNAME / PASSWORD`：本地可为空字符串，生产建议开启安全认证。
- `ELASTICSEARCH_ENABLE_FALLBACK`：ES 不可用时是否允许 PostgreSQL FTS fallback。

## Docker

开发与生产 compose 增加 Elasticsearch：

```text
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.x
  environment:
    discovery.type: single-node
    xpack.security.enabled: false
```

开发环境默认关闭安全认证，便于 MVP 演示。

## Search Index Model

Elasticsearch document id 使用 chunk id。

字段：

```ts
interface SearchChunkDocument {
  chunkId: string;
  documentId: string;
  spaceId: string;
  content: string;
  sectionTitle: string;
  sequence: number;
  tokenCount: number;
  documentType: string;
  language: string;
  securityLevel: string;
  departmentId?: string;
  allowedDepartmentIds?: string[];
  metadata: Record<string, unknown>;
  updatedAt: string;
}
```

## SearchService

必须提供：

```ts
ensureIndex(): Promise<void>
healthCheck(): Promise<void>
indexChunks(chunks: SearchChunkDocument[]): Promise<void>
deleteDocumentChunks(documentId: string): Promise<void>
searchChunks(input: SearchChunkQuery): Promise<SearchChunkResult[]>
reindexAll(): Promise<SearchReindexResult>
```

`SearchService` 调用 `SearchClient`，不直接访问 Elasticsearch SDK 外的实现细节。

## Chunk 同步

`ChunkService.processChunks(documentId)` 在创建 chunk 后同步 ES：

```text
delete old chunks
create new chunks in DB
SearchService.indexChunks(createdChunks)
```

如果 ES 同步失败：

- 不回滚 DB chunk。
- 抛出异常让 ingestion stage 失败。
- 文档会进入 FAILED，便于 demo 和排障发现索引问题。

## Keyword Retriever

`KeywordRetriever` 改为：

```text
SearchService.searchChunks()
-> 成功：返回 ES BM25 结果
-> 失败且 fallback enabled：ChunkRepository.searchByKeyword()
-> 失败且 fallback disabled：抛出错误
```

Fallback 只作为可用性保护，不是默认主路径。

## Reindex Script

新增脚本：

```text
pnpm --filter @enterprise-agentic-rag/backend search:reindex
```

作用：

```text
读取 DB 中 READY document 的 chunks
-> ensureIndex
-> 批量写入 Elasticsearch
```

脚本只能调用 `SearchService`，不能直接访问 Elasticsearch。

## 验收标准

- 新增 5 个任务文档。
- Docker compose 增加 Elasticsearch。
- 环境变量 schema 校验包含 Elasticsearch 配置。
- `SearchClient` 是唯一 Elasticsearch HTTP 调用位置。
- `KeywordRetriever` 主路径使用 `SearchService`。
- PostgreSQL FTS fallback 可选保留。
- Chunk 生成后可同步到 Elasticsearch。
- Reindex script 可重建 index。
- Controller / Service 不直接访问 Elasticsearch。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
