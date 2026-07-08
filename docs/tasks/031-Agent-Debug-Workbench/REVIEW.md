# TASK-031：Review Checklist

## 实现前

- [ ] 已阅读 TASK-031 SPEC。
- [ ] 已确认不新增后端 API。
- [ ] 已确认现有 `agentService.streamChat()` 可复用。
- [ ] 已确认组件不直接 `fetch`。
- [ ] 已确认不展示完整 prompt / Memory / DocumentContent。

## 实现中

- [ ] 新增 `agent-debug.store.ts`。
- [ ] 扩展 Agent 前端事件类型。
- [ ] 新增 Agent Debug 组件目录。
- [ ] `DemoWorkbench` 增加 Agent Debug tab。
- [ ] 所有 API 调用都在 store/service 层。
- [ ] SSE error event 能停止 running。
- [ ] stream 抛错能停止 running。
- [ ] token event 能累积 answer。
- [ ] done event 能覆盖最终结果。
- [ ] citation 展示经过截断。

## 实现后

- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。
- [ ] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store` 无组件/app/store 直连网络调用。

## Smoke

- [ ] 输入 JWT token。
- [ ] 打开 Agent Debug tab。
- [ ] 自动加载或创建 conversation。
- [ ] 输入简单问题并 Run。
- [ ] 能看到 thought / retrieval / token / done。
- [ ] 能看到 answer streaming。
- [ ] 能看到 executionId。
- [ ] 能看到 trace timeline。
- [ ] 能看到 citation 摘要。
- [ ] 错误 token 或无权限时能展示错误。
