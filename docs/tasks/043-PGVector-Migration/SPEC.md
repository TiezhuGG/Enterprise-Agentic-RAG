# TASK-043：PGVector Migration

## 目标

将当前 `ChunkEmbedding.vector Float[]` 从 PostgreSQL 数组迁移为 `pgvector` 向量类型，并把向量相似度计算下推到 PostgreSQL。

最终要求：

- PostgreSQL 启用 `vector` extension。
- Docker 开发/生产 compose 使用支持 pgvector 的 Postgres 镜像。
- Prisma schema 使用 `Unsupported("vector")` 表达向量列。
- `VectorClient` 是唯一写入、读取、检索 pgvector 的入口。
- 业务模块继续只依赖 `VectorService`，不直接接触 raw SQL 或 pgvector。

## 非目标

- 不实现 Elasticsearch。
- 不重写 Retrieval 编排。
- 不引入外部向量数据库。
- 不把 pgvector SQL 写进 Retriever / Service / Controller。
- 不修改 EmbeddingProvider。
- 不新增前端 UI。

## 数据库变更

### Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### ChunkEmbedding

```prisma
model ChunkEmbedding {
  id        String                @id @default(cuid())
  chunkId   String                @unique @map("chunk_id")
  model     String
  dimension Int
  vector    Unsupported("vector")
  createdAt DateTime              @default(now()) @map("created_at")
  updatedAt DateTime              @updatedAt @map("updated_at")
  chunk     Chunk                 @relation(fields: [chunkId], references: [id], onDelete: Cascade)

  @@index([model])
  @@map("chunk_embeddings")
}
```

### Index

使用 ivfflat cosine index：

```sql
CREATE INDEX chunk_embeddings_vector_cosine_idx
ON chunk_embeddings
USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);
```

第一版保留 `dimension` 列作为维度过滤，避免不同模型维度混查。

## Docker

开发与生产 compose 的 Postgres 镜像改为：

```text
pgvector/pgvector:pg16
```

如果本地已有旧 `postgres:16-alpine` 数据卷，需要用户重建容器或迁移到带 pgvector 的镜像。

## VectorClient 设计

允许 raw SQL 的位置：

```text
apps/backend/src/infrastructure/vector/vector.client.ts
```

必须支持：

- `healthCheck()`：检查 extension 可用。
- `createMany()`：写入 `vector`。
- `listByDocumentId()`：读取并解析 `vector::text`。
- `listByChunkIds()`：读取并解析 `vector::text`。
- `searchSimilar()`：使用 `<=>` cosine distance，返回 score。

## SQL 约束

相似度查询：

```sql
1 - (ce.vector <=> $queryVector::vector) AS score
```

查询必须继续过滤：

- `dimension`
- `Document.status = READY`
- `Document.spaceId in allowedSpaceIds`

Tenant / Data Permission Policy 仍由 RetrievalService 上层过滤，VectorClient 只负责空间级候选召回。

## 验收标准

- migration 创建 pgvector extension 成功。
- `chunk_embeddings.vector` 变为 vector 类型。
- vector index 创建成功。
- Embedding 写入成功。
- Vector similarity search 成功。
- Retrieval 链路仍能返回结果。
- pgvector raw SQL 只存在于 VectorClient / migration。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
- `pnpm db:validate` 通过。
- `pnpm db:migrate` 通过。
