# TASK-031：架构决策记录

## 决策 1：只做前端 Debug Workbench

TASK-031 不新增后端 API，不修改 AgentGraph。

原因：

- TASK-020 已经暴露生产级 Agent streaming API。
- 当前 MVP 缺口在演示可见性，而不是后端能力。
- 保持后端稳定可以降低回归风险。

后果：

- Debug Workbench 能展示现有事件和最终 trace。
- 更深层 node 输入/输出快照暂不展示，后续如需可由 Observability/Execution Timeline 专门扩展。

## 决策 2：新增独立 store，不复用 chat.store

Agent Debug 需要保存 run config、event timeline、planner decision 和 execution summary。

原因：

- `chat.store.ts` 面向日常对话体验。
- Debug Workbench 面向演示和调试，状态粒度不同。
- 避免为了 debug 需求污染 Chat UI。

后果：

- 两套 store 都复用同一个 `api-client` token。
- 两套 store 都通过 service 调 API。

## 决策 3：Event timeline 使用前端本地结构

后端 SSE 原始事件不包含统一时间戳，前端接收时补本地 timestamp。

原因：

- 不改后端 wire shape。
- 对演示来说，前端接收时间足以表达事件顺序。

后果：

- 该时间不是后端真实 node 执行时间。
- 后端真实 trace 时间仍以 `done.metadata.trace` 为准。

## 决策 4：Citation 只展示摘要

Citation 中可能包含 chunk content，本任务只展示截断摘要。

原因：

- 避免 Debug 面板变成文档正文浏览器。
- 保持和前面任务“不展示完整正文”的安全边界一致。

后果：

- 用户可以确认 citation 来源和片段摘要。
- 完整内容审阅不属于 TASK-031 范围。

## 决策 5：不引入 UI 组件库

继续使用现有 CSS 和 React 组件。

原因：

- 当前项目没有大型 UI 组件库。
- 引入新组件库会增加部署和样式一致性风险。

后果：

- Workbench 保持轻量。
- 样式通过 `globals.css` 扩展。
