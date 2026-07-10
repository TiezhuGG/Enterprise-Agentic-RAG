# TASK-053：架构决策

## 决策 1：本任务主要在前端完成

后端已经有 Upload、Ingestion、Pipeline、错误码和 readiness 能力。本任务不新增后端接口，优先通过前端 copy/helper 和 store 刷新策略提升演示闭环。

后果：

- 改动小，风险低。
- 不破坏现有 API。

## 决策 2：状态文案集中管理

新增前端 helper 管理 document status、pipeline stage、pipeline status 和错误归因。

后果：

- 组件更薄。
- 后续中文文案系统或国际化可以从这里演进。

## 决策 3：失败后也刷新状态

Ingest 失败后不能停留在旧 UI 状态，应主动刷新 document、status、pipeline events。

后果：

- 用户可以看到失败阶段。
- 服务器演示时更容易解释问题。

## 决策 4：不展示敏感原文

错误详情只展示短消息，不展示 prompt、answer、document content、API key。

后果：

- 满足生产可观测性边界。
- 演示更安全。
