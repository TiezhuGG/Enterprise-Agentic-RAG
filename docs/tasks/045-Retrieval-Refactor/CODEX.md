# TASK-045：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请严格遵守 DDD 分层和现有架构，实现 Retrieval Refactor。

## 必须先阅读

```text
docs/tasks/045-Retrieval-Refactor/SPEC.md
docs/tasks/045-Retrieval-Refactor/SEQUENCE.md
docs/tasks/045-Retrieval-Refactor/ADR.md
docs/tasks/045-Retrieval-Refactor/REVIEW.md
docs/tasks/045-Retrieval-Refactor/CODEX.md
```

## 目标

统一检索编排：

```text
vector retriever
keyword retriever
graph retriever
permission filter
RRF
reranker
context builder
```

并让 Evaluation 和 Observability Timeline 能看到安全的 retrieval breakdown。

## 必须实现

- 新增 Retrieval pipeline breakdown 类型。
- 新增 `RetrievalService.retrieveWithBreakdown()`。
- 保持 `RetrievalService.retrieve()` 向后兼容。
- `RetrievalNode` 保存 retrieval breakdown 到 AgentState。
- Execution trace retrieval metadata 输出 count / duration / status。
- Evaluation result 和 markdown report 增加 retrieval breakdown。
- 新增 hybrid retrieval dataset example。
- 前端 Observability timeline 展示 retrieval breakdown。

## 禁止

- 不改 RRF 公式。
- 不绕过 AccessPolicyService。
- 不直接在 Controller 访问 Vector / ES / Neo4j。
- 不让 Evaluation 访问 Repository / Infrastructure。
- 不记录完整 query。
- 不记录 chunk content。
- 不改 Agent Workflow 拓扑。
- 不删除 Elasticsearch fallback。

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

推荐执行：

```text
pnpm --filter @enterprise-agentic-rag/backend evaluation:run ../../docs/evaluation/hybrid-retrieval.dataset.example.json ../../docs/evaluation/reports
```

输出：

- 修改文件列表。
- Retrieval pipeline 设计。
- Breakdown 字段说明。
- Evaluation 更新。
- Frontend timeline 更新。
- 测试结果。
