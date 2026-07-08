# TASK-035：流程设计

## 编译流程

```text
AgentGraph constructor
↓
创建 StateGraph
↓
注册 memory/planner/retrieval/graph/answer/verification node
↓
注册 conditional edge
↓
compile()
```

## 执行流程

```text
AgentService
↓
AgentGraph.run(initialState, { onEvent })
↓
LangGraph compiled graph invoke
↓
返回 final AgentState
```

## 条件分支

```text
planner
↓
needsRetrieval ? retrieval : skip retrieval
↓
needsGraph ? graph : skip graph
```

Skip 仍需要写入 trace 和 observability。

## Streaming

Answer node 继续使用现有 `runStream()`。

LangGraph runtime 负责节点编排，token 事件仍由 AnswerNode 通过 `onEvent` 推送。

## 错误流程

```text
node throw
↓
recordAgentNode failed
↓
AgentService executeStream 捕获
↓
SSE error event
```
