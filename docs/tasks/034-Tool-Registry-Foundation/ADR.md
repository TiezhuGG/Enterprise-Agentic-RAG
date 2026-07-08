# TASK-034：架构决策记录

## 决策 1：先做 Tool Registry，再做 LangGraph

原因：

- 当前 Tool 还没有统一协议。
- LangGraph Node 后续更适合依赖统一 ToolRegistry。
- 先抽 Registry 可以降低 runtime migration 风险。

后果：

- TASK-034 不引入新依赖。
- TASK-035 可以专注迁移 AgentGraph。

## 决策 2：不做动态 Tool Calling

原因：

- 当前目标是内部调用协议，不是让 LLM 选择工具。
- 动态 Tool Calling 会引入安全、schema、执行预算等额外问题。

后果：

- Node 仍显式选择工具。
- ToolRegistry 是内部基础设施。

## 决策 3：MemoryTool 保留 saveTurn 方法

原因：

- AgentService 在回答后保存 memory turn，不属于 Node 执行阶段。
- `invoke()` 用于 MemoryNode 的 memory load。

后果：

- MemoryTool 同时支持 `invoke(loadInput)` 和 `saveTurn()`。
- 后续如需统一 save 操作，可单独拆 `memory-save` tool。

## 决策 4：ToolRegistry 使用 Nest provider

原因：

- 当前 Agent 模块已经使用 Nest DI。
- 保持与现有模块风格一致。

后果：

- ToolRegistry 构造函数注入具体工具。
- Nodes 注入 ToolRegistry。
