# TASK-044：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请严格遵守 DDD 分层和 infrastructure 隔离原则，实现 Elasticsearch BM25。

## 必须先阅读

```text
docs/tasks/044-Elasticsearch-BM25/SPEC.md
docs/tasks/044-Elasticsearch-BM25/SEQUENCE.md
docs/tasks/044-Elasticsearch-BM25/ADR.md
docs/tasks/044-Elasticsearch-BM25/REVIEW.md
docs/tasks/044-Elasticsearch-BM25/CODEX.md
```

## 目标

把 keyword retrieval 从 PostgreSQL FTS 升级为 Elasticsearch BM25。

主链路：

```text
KeywordRetriever
-> SearchService
-> SearchClient
-> Elasticsearch
```

Fallback：

```text
KeywordRetriever
-> ChunkRepository.searchByKeyword()
```

## 必须实现

- 新增 `apps/backend/src/infrastructure/search/`。
- Docker compose 增加 Elasticsearch。
- Config 增加 Elasticsearch 配置。
- `SearchService.ensureIndex()`。
- `SearchService.indexChunks()`。
- `SearchService.searchChunks()`。
- `SearchService.deleteDocumentChunks()`。
- `SearchService.reindexAll()`。
- `SearchService.healthCheck()`。
- `ChunkService.processChunks()` 创建 chunk 后同步 ES。
- `KeywordRetriever` 改用 SearchService，并保留 PostgreSQL FTS fallback。
- 新增 `search:reindex` 脚本。

## 禁止

- Controller 访问 Elasticsearch。
- Service 直接写 Elasticsearch HTTP。
- RetrievalService 直接调用 SearchClient。
- 删除 PostgreSQL FTS fallback。
- 修改 Vector / Reranker / Agent 编排。
- 引入后台管理 UI。
- 记录 prompt、answer、document content、chunk content 到日志。

## 验证

必须执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:deploy
```

如果 Docker 可用，额外验证：

```text
docker compose --env-file .env -f docker/docker-compose.yml up -d elasticsearch
pnpm --filter @enterprise-agentic-rag/backend search:reindex
```

输出时说明：

- 修改文件列表。
- 新增目录。
- Search 设计。
- BM25 查询方式。
- Fallback 策略。
- 测试结果。
