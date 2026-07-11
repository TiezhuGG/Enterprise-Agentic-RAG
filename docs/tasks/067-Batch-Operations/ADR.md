# TASK-067：ADR

## 决策一：不新增 BatchJob 表

第一版批量操作是同步编排，不持久化批处理任务。

原因：

- 当前单文档 Ingestion 已有 PipelineJob / PipelineEvent。
- 批量操作主要服务前端管理效率。
- 不引入队列，降低 MVP 复杂度。

后果：

- 大批量操作会占用请求时间。
- 后续如需更强能力，可扩展为 `BatchJob + async worker`。

## 决策二：BatchService 只编排现有 Service

BatchService 不访问 Repository / Prisma。

原因：

- 权限规则已经沉淀在 Document / Ingestion / Taxonomy Service。
- 批量层不应该复制业务判断。
- 这样可以避免权限逻辑在批量 API 中分叉。

## 决策三：逐项失败，不整体回滚

批量操作采用 best-effort。

原因：

- 企业文档常出现部分失败。
- 用户更需要知道哪些文档失败，而不是全部中断。
- Archive / Ingest / Taxonomy 都不是需要强事务包裹的跨文档操作。

## 决策四：前端多选状态放在 Workbench store

多选是 Workbench 范围状态，不放在单个组件内部。

原因：

- BatchOperationsPanel、DocumentListPanel、后续可能的 Batch toolbar 都需要共享。
- 切换 Space 或刷新文档列表时可以统一清理无效选中项。

## 决策五：新增 batch smoke 脚本

新增 `pnpm batch:smoke`。

原因：

- TASK-067 的价值不只在 API 类型，而在真实服务编排。
- Smoke 可用于本地、部署前和服务器演示前快速验证批量管理链路。

后果：

- Smoke 会创建临时测试 Space 和文档，并最后将文档归档，用于审计和复查。
- 不做 destructive reset，避免误删用户已有数据。
