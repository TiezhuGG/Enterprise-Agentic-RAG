# TASK-035：架构决策记录

## 决策 1：保持 AgentState 兼容

原因：

- 前端、AgentService、Nodes 已依赖当前状态结构。
- 本任务目标是 runtime migration，不是状态模型重写。

后果：

- LangGraph state annotation 以现有 AgentState 为核心。

## 决策 2：保留现有 Node 类

原因：

- Node 内已有 Observability、LLM、Tool 调用逻辑。
- 直接复用可降低迁移风险。

后果：

- LangGraph node function 只是包装现有 Node.run()。

## 决策 3：SSE 事件不变

原因：

- 前端 Agent Debug Workbench 已消费这些事件。

后果：

- 不新增前端改动。

## 决策 4：本任务不实现循环

原因：

- 先迁移 runtime，再扩展 loop。
- 分步降低风险。

后果：

- TASK-036 再做 Loop Planning + Verification。
