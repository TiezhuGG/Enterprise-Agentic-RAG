# TASK-038：Review Checklist

## 实现前

- [x] 已确认 `/health` 不能变成重检查。
- [x] 已确认 `/health/readiness` 不调用模型推理。
- [x] 已确认不新增数据库表。
- [x] 已确认指标名称稳定。

## 实现后

- [x] 新增 5 个任务文档。
- [x] `ObservabilityService` 新增 embedding/reranker/vector/storage/memory/provider health 指标方法。
- [x] `ReadinessController` 新增 `/health/readiness`。
- [x] 新增 `ReadinessModule` / `ReadinessService`。
- [x] Prisma / Redis / Storage / Graph / Vector 有轻量 health 方法。
- [x] Embedding pipeline 记录 embedding 指标。
- [x] Reranker pipeline 记录 reranker 指标。
- [x] VectorService 记录 vector 指标。
- [x] StorageService 记录 storage 指标。
- [x] MemoryService 记录 memory 指标。
- [x] metrics/readiness 不输出密钥、prompt、answer、document content。
- [x] `pnpm format:check` 通过。
- [x] `pnpm lint` 通过。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `pnpm db:validate` 通过。
- [x] `pnpm db:migrate` 通过。
- [x] `pnpm db:seed` 通过。

## 风险点

- Readiness 失败不能导致服务崩溃。
- 指标打点不能吞掉业务异常。
- 不要把 provider API key 写到日志或 metrics label。
- 不要在 health check 中发起昂贵模型请求。
