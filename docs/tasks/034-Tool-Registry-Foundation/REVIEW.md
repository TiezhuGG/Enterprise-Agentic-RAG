# TASK-034：Review Checklist

## 实现前

- [ ] 已确认现有 Tool 只调用 Service。
- [ ] 已确认不引入 LangGraph。
- [ ] 已确认 Agent API 不变。

## 实现中

- [ ] 新增 `tool.types.ts`。
- [ ] 新增 `tool.registry.ts`。
- [ ] `RetrievalTool` 实现 `AgentTool`。
- [ ] `GraphTool` 实现 `AgentTool`。
- [ ] `MemoryTool` 实现 `AgentTool`。
- [ ] Nodes 通过 `ToolRegistry` 获取工具。
- [ ] AgentModule 注册 `ToolRegistry`。

## 实现后

- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。
- [ ] Agent streaming API 未变化。

## Smoke

- [ ] 简单问题可触发 Retrieval。
- [ ] 复杂问题可触发 Graph。
- [ ] Memory enable 时可加载 Memory。
- [ ] Tool 未注册时错误明确。
