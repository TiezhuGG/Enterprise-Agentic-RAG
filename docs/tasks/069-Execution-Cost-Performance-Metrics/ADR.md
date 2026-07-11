# TASK-069：ADR

## 决策一：不新增成本表

成本与性能先复用 ExecutionRun / ExecutionTraceEvent。

原因：

- 当前 execution timeline 已经是执行观测的事实来源。
- 第一版只做估算和展示，不需要账单级持久化。
- 避免引入额外迁移和复杂账务语义。

## 决策二：使用估算 token，不依赖供应商 usage

OpenAI-compatible、本地 Ollama、第三方模型的 usage 字段不统一。

原因：

- 统一估算可覆盖 streaming 和非 streaming。
- 不需要改 Provider 接口返回结构。
- 不记录正文，只保存 token 数。

后果：

- 数值是近似值，不是精确账单。
- 后续可在 Provider 层接入真实 usage 并优先使用真实 usage。

## 决策三：成本价格用 env 配置，默认 0

原因：

- 不把供应商价格写死在代码里。
- 本地 demo 不配置也能启动。
- 用户部署时可按实际模型价格填写。

## 决策四：Ops Summary 聚合当前用户视角

与 TASK-068 保持一致，不做全租户账单。

原因：

- 当前系统还没有独立运维管理员权限模型。
- 当前用户视角适合 demo 和个人排障。

## 决策五：性能指标只展示聚合与节点耗时

不展示 prompt、answer 或文档正文。

原因：

- 运维控制台常用于屏幕共享。
- 成本/性能排障不需要正文内容。
