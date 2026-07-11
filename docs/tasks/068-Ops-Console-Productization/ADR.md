# TASK-068：ADR

## 决策一：新增 Ops 聚合模块，而不是继续堆在 Observability 组件里

Ops Console 面向“演示/排障首页”，Observability 面向“细节追踪”。

原因：

- 前端直接拼多个 API 会让页面逻辑变重。
- 后端聚合可以统一处理 tenant / user / space 过滤。
- 后续 TASK-069 的成本与性能指标可以自然挂到 Ops Summary。

## 决策二：不从浏览器触发运维命令

Smoke、seed、reindex 等命令只展示为可复制命令。

原因：

- 浏览器触发 shell 命令风险高。
- 当前目标是演示和排障，不是完整运维平台。
- 服务器部署时仍应通过终端或 CI 执行命令。

## 决策三：OpsRepository 可以读聚合数据，但 Controller 不碰 Repository

`OpsService -> OpsRepository -> Prisma` 是允许的。

原因：

- Ops Summary 需要跨模块聚合统计。
- 这些统计不属于 Document/Execution 单一领域的业务规则。
- Controller 仍保持薄入口。

## 决策四：不记录敏感正文

Ops Summary 只展示 metadata、状态、数量、耗时和错误摘要。

原因：

- 运维面板常在演示或屏幕共享时打开。
- 不能泄露 prompt、answer、document content、API key。

## 决策五：第一版以当前用户视角为准

不做全租户管理员视角。

原因：

- 当前 RBAC/租户边界已经复杂，先保证普通用户视角准确。
- 后续如要企业管理员视角，应增加明确权限与审计。
