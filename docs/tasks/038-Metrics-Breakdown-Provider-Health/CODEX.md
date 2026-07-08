# TASK-038：给 Codex 的实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请实现 Metrics Breakdown & Provider Health。

必须严格遵守：

- 不新增数据库表。
- 不改 `/health` 轻量 liveness。
- 新增 `/health/readiness`。
- 不调用真实 LLM/Embedding/Reranker 推理做健康检查。
- 不输出敏感信息。

## 必须先读

```text
docs/tasks/038-Metrics-Breakdown-Provider-Health/SPEC.md
docs/tasks/038-Metrics-Breakdown-Provider-Health/SEQUENCE.md
docs/tasks/038-Metrics-Breakdown-Provider-Health/ADR.md
docs/tasks/038-Metrics-Breakdown-Provider-Health/REVIEW.md
docs/tasks/038-Metrics-Breakdown-Provider-Health/CODEX.md
```

## 实现内容

扩展 Observability：

- `recordEmbedding`
- `recordReranker`
- `recordVector`
- `recordStorage`
- `recordMemory`
- `recordProviderHealth`

新增 Readiness：

```text
GET /health/readiness
```

为基础设施新增轻量检查：

- Prisma
- Redis
- Storage
- Graph
- Vector

为业务链路接入细分指标：

- Embedding
- Reranker
- Vector
- Storage
- Memory

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:migrate
pnpm db:seed
```

如本地依赖未启动，`/health/readiness` 应返回 degraded，而不是抛出未处理异常。
