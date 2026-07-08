# TASK-036：Review Checklist

## 实现前

- [ ] 已完成 TASK-035。
- [ ] 已确认 LangGraph conditional edge 可用。
- [ ] 已确认 AGENT_MAX_ITERATIONS 配置可用。

## 实现中

- [ ] AgentState 增加 iteration 字段。
- [ ] Planner 支持 queryRewrite。
- [ ] Verification 输出 needsMoreContext。
- [ ] Graph 增加循环 edge。
- [ ] trace 支持多轮节点。
- [ ] streaming 支持 iteration / verification。

## 实现后

- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。

## Smoke

- [ ] 上下文不足时触发二次检索。
- [ ] 达到 maxIterations 后停止。
- [ ] done event 仍然返回 answer/citations/trace。
