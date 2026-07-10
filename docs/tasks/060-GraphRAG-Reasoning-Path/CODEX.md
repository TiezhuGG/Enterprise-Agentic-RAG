# TASK-060：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 GraphRAG Reasoning Path。

必须遵守：

- 先读本目录下 `SPEC.md`、`SEQUENCE.md`、`ADR.md`、`REVIEW.md`。
- 不新增外部工具。
- 不新增 Graph API。
- 不绕过 Retrieval / AccessPolicy 权限过滤。
- 不在前端直接访问 Neo4j。
- 不记录完整 prompt、answer、document content。

实现重点：

- `GraphContext` 增加 path metadata。
- `KnowledgeGraphRepository.searchByEntityNames()` 返回 graph path。
- `GraphRetriever` 与 `AnswerNode` 把 graph path 放入 citation metadata。
- Agent `graph` SSE event 返回 path summary。
- 前端 Agent Debug 展示 GraphRAG paths。
- Citation Inspector 标记 graph source，并展示 source -> relation -> target。

完成后执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

输出：

- 修改文件
- GraphRAG path 设计
- 后端事件 / citation 变化
- 前端展示变化
- 测试结果
