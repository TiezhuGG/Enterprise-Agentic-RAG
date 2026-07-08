# TASK-029：架构决策记录

## 背景

TASK-026 已经建立 MVP Demo Orchestration，TASK-027 和 TASK-028 分别补齐 Cleaner 和 Metadata。但文档处理过程仍然缺少可查询的执行历史。

当前 Ingestion 的 `stages` 只存在于本次响应，Observability 日志也不是业务查询模型。前端文档工作台、Evaluation 回归分析、部署后的问题排查都需要一个稳定的 Job/Event 读模型。

## 决策 1：新增 Pipeline 模块

决定：

```text
apps/backend/src/modules/pipeline/
```

原因：

- Pipeline Job/Event 是文档处理领域的执行历史，不属于 infrastructure。
- 它会被 Ingestion、未来前端工作台、Evaluation 使用。
- 独立模块可以保持 Controller -> Service -> Repository -> Prisma 的边界。

后果：

- IngestionService 依赖 PipelineService。
- PipelineService 负责权限和 metadata 清洗。

## 决策 2：不引入队列

决定：

TASK-029 不引入 BullMQ、Kafka、Temporal 或后台 worker。

原因：

- 当前目标是可部署可演示 MVP 的闭环，不是任务调度系统。
- 现有 Ingestion 是同步流程，先把同步流程可追踪化，风险更小。
- 队列会引入新的失败模型、重试语义和部署依赖，适合后续独立任务。

后果：

- Pipeline Job/Event 记录当前同步执行历史。
- 未来可以在不破坏数据模型的情况下把执行器替换为异步 worker。

## 决策 3：stage 使用 String 存储

决定：

```prisma
stage String
```

原因：

- 现有阶段名使用 `document-processing`、`graph-extraction` 这样的 kebab-case。
- Prisma enum 不适合直接存带 `-` 的业务阶段名。
- 未来阶段可扩展，不需要频繁改 enum。

后果：

- TypeScript 侧继续使用 `IngestionStage` 约束阶段。
- DB 层不强约束 stage 值。

## 决策 4：Job status 使用 enum

决定：

```text
RUNNING / SUCCEEDED / FAILED / CANCELED
```

原因：

- Job 状态是稳定生命周期状态，应由 DB 强约束。
- 前端工作台、Evaluation、运维查询需要稳定过滤条件。

后果：

- 本任务不实现取消逻辑，但预留 `CANCELED`。

## 决策 5：Event status 使用 enum

决定：

```text
STARTED / SUCCEEDED / FAILED / SKIPPED
```

原因：

- Event status 是稳定结果。
- 第一版只在阶段完成后写事件，不写每个阶段的 STARTED 事件。
- 保留 STARTED 便于未来异步 worker 和实时 timeline。

后果：

- 当前实现主要使用 `SUCCEEDED / FAILED / SKIPPED`。

## 决策 6：Pipeline API 只读

决定：

新增 API 只查询 Job/Event，不提供手动创建、修改、删除接口。

原因：

- Job/Event 是系统执行历史，不能由外部客户端随意写入。
- 写入只能来自 IngestionService。

后果：

- 后续如果要支持 retry，可以新增专门的 command API。

## 决策 7：metadata 必须清洗

决定：

PipelineService 在写入 metadata 前做 sanitize。

原因：

- Stage metadata 可能来自不同模块。
- 必须防止正文、prompt、answer、buffer、token、secret 等敏感内容进入执行历史。

后果：

- 部分复杂 metadata 会被转成简化结构或移除。
- 正文类字段不会持久化。

## 边界

不做：

- 异步任务队列。
- retry / cancel。
- Pipeline 前端页面。
- Graph 可视化。
- Agent timeline。
- 将 Observability 替换成 Pipeline。
- 将 Ingestion 改成事件驱动架构。
