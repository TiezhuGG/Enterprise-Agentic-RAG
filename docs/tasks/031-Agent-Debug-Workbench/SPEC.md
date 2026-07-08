# TASK-031：Agent Debug Workbench

## 目标

实现 Agent Debug Workbench，让 MVP 演示可以观察一次 Agent 执行的完整过程。

当前前端已经有 Chat UI，但 Agent 的 planner decision、retrieval/graph 事件、token streaming、citations、trace timeline 和最终 verified 状态主要隐藏在聊天侧栏里。TASK-031 在 `apps/frontend` 内新增独立调试工作台，复用现有 Agent API，不新增后端领域能力。

## 范围

新增：

```text
docs/tasks/031-Agent-Debug-Workbench/
├── SPEC.md
├── SEQUENCE.md
├── ADR.md
├── REVIEW.md
└── CODEX.md

apps/frontend/store/agent-debug.store.ts
apps/frontend/components/agent-debug/
```

修改：

```text
apps/frontend/types/agent.ts
apps/frontend/components/workbench/DemoWorkbench.tsx
apps/frontend/app/globals.css
```

## 复用 API

本任务只复用现有接口：

```text
POST /agent/chat/stream
GET /conversations
POST /conversations
GET /conversations/:id/messages
```

禁止新增后端 API。

## 前端状态

新增：

```text
apps/frontend/store/agent-debug.store.ts
```

保存：

- `authToken`
- `conversations`
- `conversationId`
- `question`
- `runConfig`
- `running`
- `events`
- `executionId`
- `plannerDecision`
- `retrievalCount`
- `graphCount`
- `answer`
- `trace`
- `citations`
- `error`

默认运行参数：

```ts
{
  limit: 8,
  vectorLimit: 8,
  keywordLimit: 8,
  maxContextTokens: 3000,
}
```

## 类型

扩展 `apps/frontend/types/agent.ts`：

- `GraphEventData`
- `CitationEventData`
- `DoneEventData`

保持现有 `AgentEvent` 兼容，不修改后端 wire shape。

## UI 组件

新增：

```text
apps/frontend/components/agent-debug/
├── AgentDebugWorkbench.tsx
├── AgentRunForm.tsx
├── AgentExecutionSummary.tsx
├── AgentEventTimeline.tsx
├── AgentTraceTimeline.tsx
├── AgentTokenStream.tsx
└── AgentCitationInspector.tsx
```

## 页面行为

- Workbench tab 扩展为 `Pipeline / Agent Debug / Assistant`。
- `Agent Debug` tab 渲染 `AgentDebugWorkbench`。
- 初始化时加载当前用户 conversations。
- 没有 conversation 时自动创建一个 `Debug Session`。
- 用户可选择 conversation、输入 question。
- 用户可调整 `limit / vectorLimit / keywordLimit / maxContextTokens`。
- 点击 Run 后调用 `agentService.streamChat()`。
- 实时处理 SSE：
  - `thought`：显示 `needsRetrieval / needsGraph`
  - `retrieval`：显示 retrieval count
  - `graph`：显示 graph count
  - `token`：累积 answer
  - `citation`：追加 citation
  - `done`：写入 final metadata、trace、executionId
  - `error`：展示错误并停止运行
- Trace timeline 根据 `done.metadata.trace` 展示 node、status、duration。
- Event timeline 展示事件类型、时间、摘要 payload。
- Citation inspector 只展示 citation 摘要，不展示完整文档正文。

## 禁止项

- 不新增 backend API。
- 不修改 AgentGraph / Node 编排逻辑。
- 不实现动态 Tool Calling。
- 不实现多轮循环规划。
- 不展示完整 prompt。
- 不展示 Memory 原文。
- 不展示完整 DocumentContent。
- 不引入大型 UI 组件库。
- React 组件不得直接 `fetch`。

## 验收标准

- 可以打开 Agent Debug tab。
- 可以加载或创建 conversation。
- 可以输入 question 并触发 streaming。
- `thought / retrieval / graph / token / citation / done / error` 能被解析。
- token streaming 能实时累积 answer。
- done 后显示 executionId、verified、usedGraph、usedMemory。
- trace timeline 显示 Agent node。
- citation inspector 不展示完整文档正文。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
