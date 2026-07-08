# TASK-038：Metrics Breakdown & Provider Health

## 目标

补齐生产可观测性第二阶段：指标拆分与 Provider Readiness。

当前已有：

- `/health`
- `/metrics`
- 基础 counters / durations
- Execution Timeline

本任务新增：

- embedding / reranker / vector / graph / storage / memory / provider health 指标。
- `/health/readiness`。
- 基础设施轻量健康检查方法。

## 禁止项

- 不新增数据库表。
- 不引入外部 APM。
- 不引入 LangSmith。
- 不改 `/health` 的轻量 liveness 语义。
- 不在 readiness 中调用 LLM chat。
- 不在 readiness 中调用 embedding 推理。
- 不在 readiness 中调用 reranker 推理。
- 不输出 API key、password、prompt、answer、document content。

## 新增指标

```text
embedding_requests_total
embedding_vectors_total
embedding_duration_ms

reranker_requests_total
reranker_documents_total
reranker_duration_ms

vector_operations_total
vector_operation_duration_ms

storage_operations_total
storage_operation_duration_ms

memory_operations_total
memory_operation_duration_ms

provider_health_total
provider_health_duration_ms
```

## Readiness API

新增：

```text
GET /health/readiness
```

返回：

```ts
{
  status: 'ok' | 'degraded';
  timestamp: string;
  checks: Array<{
    name: 'database' | 'redis' | 'storage' | 'graph' | 'vector' | 'llm' | 'embedding' | 'reranker';
    status: 'ok' | 'failed' | 'skipped';
    durationMs?: number;
    message?: string;
  }>;
}
```

真实探测：

- database：`SELECT 1`
- redis：`PING`
- storage：`ensureBucket`
- graph：`RETURN 1 AS ok`
- vector：DB-backed delegate check

配置级探测：

- llm
- embedding
- reranker

## 验收标准

- `/health` 继续返回轻量 ok。
- `/health/readiness` 在依赖失败时返回 degraded。
- `/metrics` 包含新增指标。
- embedding pipeline 记录 embedding/vector 指标。
- reranker pipeline 记录 reranker 指标。
- storage 操作记录 storage 指标。
- memory 操作记录 memory 指标。
- readiness 不输出敏感配置。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
