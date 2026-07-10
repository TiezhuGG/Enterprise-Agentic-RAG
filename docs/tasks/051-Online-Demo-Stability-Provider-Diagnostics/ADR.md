# TASK-051 ADR

## 决策 1：Provider smoke 做真实轻量探测

配置完整不等于服务可用。线上演示最常见失败来自 LLM、Embedding、Reranker endpoint 配错或服务未启动，因此 smoke 必须真实调用最小请求。

## 决策 2：Readiness 扩展字段而不新增数据库表

provider 诊断是运行时状态，不需要持久化。通过 `ReadinessCheck` 增加 `stage/code/configured/reachable/inference` 字段即可满足前端展示。

## 决策 3：后端错误码先覆盖演示关键路径

本任务只标准化最容易导致演示翻车的错误：

- 大模型不可用
- 向量模型不可用
- 重排序不可用
- 图谱不可用
- 文件格式不支持

更完整的错误码体系留到 TASK-070。

## 决策 4：不记录真实 prompt/answer/content

provider probe 使用固定短文本，但报告与日志只记录状态、耗时、endpoint 摘要、model 和错误码。

## 后果

- 线上部署前可以快速判断是否具备完整演示条件。
- 前端能显示中文业务错误。
- provider readiness 会产生少量真实模型调用成本。
