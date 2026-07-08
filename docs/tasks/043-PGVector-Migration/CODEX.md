# TASK-043：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请严格遵守 DDD 分层，实现 PGVector Migration。

## 必须先阅读

```text
docs/tasks/043-PGVector-Migration/SPEC.md
docs/tasks/043-PGVector-Migration/SEQUENCE.md
docs/tasks/043-PGVector-Migration/ADR.md
docs/tasks/043-PGVector-Migration/REVIEW.md
docs/tasks/043-PGVector-Migration/CODEX.md
```

## 目标

把 `ChunkEmbedding.vector Float[]` 替换为 PostgreSQL pgvector，并让向量检索使用数据库相似度计算和索引。

## 必须实现

- Docker dev/prod Postgres 镜像切换为 `pgvector/pgvector:pg16`。
- Prisma schema `ChunkEmbedding.vector` 改为 `Unsupported("vector")`。
- 新增 migration：
  - `CREATE EXTENSION IF NOT EXISTS vector`
  - 数组列转换为 `vector`
  - 创建 cosine vector index
- `VectorClient` 使用 raw SQL：
  - insert vector
  - list vector
  - search vector
  - health check extension
- `VectorService` API 保持不变。
- Retrieval / Embedding / Agent 不直接接触 pgvector。

## 禁止

- 不在业务 Service 写 pgvector SQL。
- 不在 Retriever 写 pgvector SQL。
- 不引入外部 Vector DB。
- 不保留 Node 内存 cosine fallback。
- 不修改 EmbeddingProvider。
- 不做 Elasticsearch。

## 验证

完成后执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:migrate
```

如果本地 Postgres 不支持 pgvector，需要说明失败原因和用户需要切换容器镜像。

输出：

- 修改文件列表
- pgvector 设计说明
- migration 说明
- VectorClient 改造说明
- 测试结果
