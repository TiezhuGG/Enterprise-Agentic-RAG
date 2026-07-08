# TASK-035：Review Checklist

## 实现前

- [ ] 已完成 TASK-034。
- [ ] 已安装 `@langchain/langgraph`。
- [ ] 已安装 `@langchain/core`。
- [ ] 已阅读官方 LangGraph JS 文档。

## 实现中

- [ ] `AgentGraph.run()` 使用 LangGraph runtime。
- [ ] 保留现有 node trace。
- [ ] 保留 skip trace。
- [ ] 保留 token streaming。
- [ ] 保留 SSE event shape。
- [ ] 保留 max iterations 保护。

## 实现后

- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。
- [ ] Agent Debug Workbench 不需要改。

## Smoke

- [ ] 简单问题走 retrieval。
- [ ] 复杂问题可走 graph。
- [ ] answer token 持续返回。
- [ ] done 包含 trace/citation。
