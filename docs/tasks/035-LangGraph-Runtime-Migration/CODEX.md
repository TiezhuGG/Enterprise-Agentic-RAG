# TASK-035：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请将当前 AgentGraph runtime 迁移到官方 LangGraph。

必须遵守：

- 先阅读官方 LangGraph JS 文档。
- 保持 Agent API 兼容。
- 保持 SSE event shape 兼容。
- 保持前端无需修改。
- 不实现循环规划。
- 不实现动态 Tool Calling。
- 不引入 LangSmith 强依赖。

必须先阅读：

```text
docs/tasks/035-LangGraph-Runtime-Migration/SPEC.md
docs/tasks/035-LangGraph-Runtime-Migration/SEQUENCE.md
docs/tasks/035-LangGraph-Runtime-Migration/ADR.md
docs/tasks/035-LangGraph-Runtime-Migration/REVIEW.md
docs/tasks/035-LangGraph-Runtime-Migration/CODEX.md
```

验证：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
