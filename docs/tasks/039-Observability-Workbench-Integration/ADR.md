# TASK-039：架构决策记录

## 决策 1：TASK-039 以前端集成为主

TASK-037 已提供 Execution Timeline API。

TASK-038 已提供 Readiness 和 Metrics Breakdown。

因此 TASK-039 不再新增后端领域能力，只把现有可观测能力接入 Demo Workbench。

后果：

- 实现风险低。
- 演示价值高。
- 后端边界不被打散。

## 决策 2：新增 Observability tab，而不是塞进 Agent Debug

Agent Debug 关注一次 Agent streaming 的实时过程。

Observability tab 关注持久化执行记录、系统状态和指标。

两者通过 `executionId` 串联。

后果：

- 实时调试和事后回放职责清晰。
- 面试演示时可以从 Agent Debug 跳到 Timeline 解释系统内部链路。

## 决策 3：Metrics 第一版只做 breakdown，不做完整监控系统

本项目当前目标是可部署、可演示、可写进简历的 MVP。

完整 Prometheus / Grafana / APM UI 会显著扩大任务范围。

本任务只解析 `/metrics` 中关键指标是否存在，并按模块展示。

后果：

- 保持实现轻量。
- 后续可以接 Grafana 或自定义时间序列面板。

## 决策 4：Execution metadata 前端二次脱敏

后端 Observability 已避免记录正文和敏感字段。

前端仍需要二次保护：

- 限制字符串长度。
- 屏蔽敏感 key。
- 对未知对象只做浅层摘要。

原因：

- Timeline 是演示面板，不能因为未来 metadata 扩展而泄露 prompt / answer / content。

## 决策 5：不做自动轮询

TASK-039 第一版采用手动 refresh。

原因：

- 降低前端复杂度。
- 避免本地演示时重复请求。
- 避免 readiness 对外部依赖造成持续压力。

后续如果需要线上体验，可在 TASK-040 之后增加低频轮询或 SSE observability event。

## 决策 6：Execution API 继续遵守用户隔离

`/executions` 已由后端基于 JWT 和 `ExecutionContext.userId` 过滤。

前端不尝试构造跨用户查询。

后果：

- 保持企业级权限边界。
- Observability Workbench 只展示当前登录用户的执行记录。
