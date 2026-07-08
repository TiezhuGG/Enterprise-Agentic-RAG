# TASK-035：LangGraph Runtime Migration

## 目标

将当前自研 `AgentGraph.run()` 迁移到官方 LangGraph runtime。

保持现有 Agent API、SSE 事件和前端 Workbench 兼容。

## 新增依赖

```text
@langchain/langgraph
@langchain/core
```

## Runtime 流程

使用 `StateGraph` 表达当前流程：

```text
START
-> memory
-> planner
-> conditional retrieval
-> conditional graph
-> answer
-> verification
-> END
```

## 保持兼容

保持不变：

- `AgentState` 主要字段
- `AgentService.execute()`
- `AgentService.executeStream()`
- `AgentResponse`
- SSE event wire shape
- Observability trace
- Agent Debug Workbench

## 禁止项

- 不实现循环规划。
- 不实现动态 Tool Calling。
- 不实现 Multi-Agent。
- 不引入 LangSmith 强依赖。
- 不修改前端。

## 验收标准

- 简单问题仍走 Retrieval。
- 复杂问题仍可走 Graph。
- token streaming 正常。
- citation 正常。
- trace 正常。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
