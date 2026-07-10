# TASK-051 Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 TASK-051：Online Demo Stability & Provider Diagnostics。

## 要求

- 严格遵守现有 DDD/Infrastructure 边界。
- 不让 Controller 访问 provider、Prisma、Redis、Neo4j SDK。
- 不记录 API key、prompt、answer、document content、file buffer。
- 不新增大功能，不改 Agent 编排。

## 实现内容

1. 新增 provider diagnostics 能力。
2. `/health/readiness` 区分配置、连接、真实推理状态。
3. `provider:smoke` 真实探测 LLM/Embedding/Reranker。
4. 增加演示关键错误码和中文 message。
5. 前端 Observability/错误展示读取并显示中文原因。

## 错误码

```text
LLM_UNAVAILABLE
EMBEDDING_UNAVAILABLE
RERANKER_UNAVAILABLE
GRAPH_UNAVAILABLE
UNSUPPORTED_FILE_TYPE
```

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

推荐执行：

```bash
pnpm provider:smoke
```
