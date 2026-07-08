# TASK-036：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请基于 LangGraph runtime 实现有限循环规划和 Verification。

必须遵守：

- 不做 Multi-Agent。
- 不做外部工具调用。
- 不做 Autonomous Agent。
- 不改变已有 Agent API 请求结构。
- 保持旧 SSE 事件兼容。

必须先阅读：

```text
docs/tasks/036-Loop-Planning-Verification/SPEC.md
docs/tasks/036-Loop-Planning-Verification/SEQUENCE.md
docs/tasks/036-Loop-Planning-Verification/ADR.md
docs/tasks/036-Loop-Planning-Verification/REVIEW.md
docs/tasks/036-Loop-Planning-Verification/CODEX.md
```

验证：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
