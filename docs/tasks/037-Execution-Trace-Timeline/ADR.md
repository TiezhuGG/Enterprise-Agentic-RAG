# TASK-037：架构决策记录

## 决策 1：新增 ExecutionRun / ExecutionTraceEvent

选择新增 Agent execution 表，而不是复用 PipelineJob / PipelineEvent。

原因：

- Pipeline 表描述文档处理生命周期。
- Execution 表描述 Agent workflow 生命周期。
- 两者后续会在前端 Observability Workbench 汇总展示，但领域含义不同。

后果：

- 数据模型更清晰。
- 后续可以单独优化 Agent timeline 查询。

## 决策 2：Execution 模块通过 Service 暴露写入能力

AgentService 和 AgentGraph 只调用 ExecutionService。

Repository 只存在于 execution 模块内部。

原因：

- 保持 Controller -> Service -> Repository -> Prisma 边界。
- Agent Node 不访问数据库。

## 决策 3：不记录正文类数据

Execution metadata 只记录可观测性元数据。

不记录 prompt、answer、document content、token 原文。

原因：

- 防止泄露企业知识内容。
- 降低日志和数据库敏感数据风险。
- 后续面试演示也更符合企业级边界意识。

## 决策 4：sequence 由应用层生成

第一版 sequence 在一次 Agent run 内递增生成。

原因：

- 足够支撑 timeline 有序展示。
- 避免引入复杂分布式排序。

后果：

- 单次 workflow 内顺序稳定。
- 后续如果引入异步队列，可扩展为阶段开始/完成事件或数据库 sequence。

## 决策 5：不改 SSE Wire Shape

现有 `/agent/chat/stream` 事件格式保持兼容。

Execution timeline 是新增查询能力，不替代 streaming。

原因：

- 前端 Agent Debug Workbench 不需要重写。
- 降低 TASK-037 风险。
