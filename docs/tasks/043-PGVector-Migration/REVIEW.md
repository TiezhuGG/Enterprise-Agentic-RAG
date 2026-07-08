# TASK-043：Review Checklist

## 实现前

- [ ] 确认当前 `ChunkEmbedding.vector` 是 `Float[]`。
- [ ] 确认 VectorClient 当前在 Node 内存计算 cosine。
- [ ] 确认 Docker Postgres 镜像不支持 pgvector。
- [ ] 确认 VectorService 是业务唯一依赖入口。

## 实现中

- [ ] 修改 Docker dev compose Postgres 镜像为 `pgvector/pgvector:pg16`。
- [ ] 修改 Docker prod compose Postgres 镜像为 `pgvector/pgvector:pg16`。
- [ ] Prisma schema 中 `vector` 改为 `Unsupported("vector")`。
- [ ] 新增 migration 创建 extension。
- [ ] 新增 migration 将数组转换为 vector。
- [ ] 新增 vector cosine index。
- [ ] PrismaService 增加必要 raw execute 方法。
- [ ] VectorClient create/list/search 全部改为 raw SQL。
- [ ] 删除 Node 内存 cosine 计算。
- [ ] 确认 raw pgvector SQL 不散落到业务层。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm db:migrate`

## Smoke

- [ ] `pnpm db:seed`
- [ ] 已有文档重新执行 embedding。
- [ ] Vector search 返回结果。
- [ ] Retrieval 链路稳定。
- [ ] `/health/readiness` vector check 正常或在 pgvector 不可用时 degraded。

## 实现后结论

- [ ] pgvector 已替换 Float[]。
- [ ] VectorClient 是唯一 pgvector raw SQL 入口。
- [ ] Retrieval / Agent API 不需要改 wire shape。
