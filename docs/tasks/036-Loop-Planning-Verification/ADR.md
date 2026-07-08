# TASK-036：架构决策记录

## 决策 1：有限循环

原因：

- 企业 RAG 需要可控执行预算。
- 无限 Agent loop 不适合 MVP。

后果：

- 使用 `AGENT_MAX_ITERATIONS` 控制循环。

## 决策 2：Verification 决定是否补充上下文

原因：

- Planner 负责计划，Verification 负责判断答案是否足够。

后果：

- 不在 AnswerNode 中做检索决策。

## 决策 3：旧事件兼容

原因：

- 前端已依赖旧事件。

后果：

- 新增事件可选，旧 UI 不会崩。
