# TASK-043：架构决策记录

## ADR-001：使用 pgvector 而不是继续 Float[]

### 决策

将 `ChunkEmbedding.vector` 从 `Float[]` 迁移为 PostgreSQL `vector` 类型。

### 原因

`Float[]` 只能在应用层遍历并计算相似度，无法使用向量索引。pgvector 是单机 PostgreSQL 场景下最适合 MVP 的向量底座。

### 后果

- 本地 Postgres 必须支持 pgvector extension。
- Prisma 对 vector 使用 `Unsupported("vector")`。
- 读写 vector 需要 raw SQL。

## ADR-002：raw SQL 只允许在 VectorClient

### 决策

所有 pgvector SQL 只写在 `infrastructure/vector/vector.client.ts`。

### 原因

业务模块不应该知道 pgvector 语法，后续替换 Qdrant、Milvus 或其他 Vector DB 时，只需要改 infrastructure。

### 后果

- VectorClient 增加 `executeRaw/queryRaw` 使用。
- VectorService API 保持不变。

## ADR-003：不保留 Node cosine fallback

### 决策

删除 VectorClient 内存 cosine 排序逻辑。

### 原因

Fallback 会让 pgvector 配置错误在开发期不暴露。TASK-043 的目标是正式替换底座，应让 readiness / migration 明确失败。

### 后果

- 如果数据库没有 pgvector extension，db:migrate 或 readiness 会失败/degraded。
- 用户需要重建或迁移到 `pgvector/pgvector:pg16`。

## ADR-004：使用 ivfflat cosine index

### 决策

第一版使用 ivfflat + `vector_cosine_ops`。

### 原因

当前查询是 cosine similarity，ivfflat 是 pgvector 的稳定索引方案。HNSW 可作为后续优化任务。

### 后果

- 初期数据量少时 index 收益有限，但结构已为增长准备。
- 后续可通过 migration 增加 HNSW 或按模型/维度分区。

## ADR-005：不在 Prisma Client 操作 vector 字段

### 决策

Prisma schema 保留 relation/index 元信息，但 `vector` 读写通过 raw SQL。

### 原因

Prisma 对 pgvector 是 unsupported scalar，直接 createMany/read 体验不稳定。显式 raw SQL 更可控。

### 后果

- `ChunkEmbeddingRecord.vector` 仍对业务暴露为 `number[]`。
- VectorClient 负责 vector literal 序列化和 `vector::text` 解析。
