# TASK-030：架构决策记录

## 背景

项目已经具备后端 RAG ingest、metadata、pipeline timeline、Agent Chat API 和基础 Chat UI。但演示时仍需要手工调接口完成文档上传、ingestion 和 pipeline 查询。

TASK-030 选择补齐前端工作台基座，让 MVP 可以通过浏览器完成主要演示链路。

## 决策 1：不新增后端 API

决定：

前端只消费已有 API：

- `/spaces`
- `/spaces/:spaceId/documents`
- `/spaces/:spaceId/documents/upload`
- `/documents/:id/metadata`
- `/documents/:id/ingest`
- `/documents/:id/ingest/status`
- `/documents/:documentId/pipeline/jobs`
- `/pipeline/jobs/:jobId/events`

原因：

- TASK-026~029 已经提供闭环 API。
- 本任务目标是前端演示基座，不是后端领域扩展。

后果：

- 如果某些查询缺少批量聚合，前端先用多次请求组合。

## 决策 2：使用单独 Workbench Store

决定：

新增 `workbench.store.ts`，不把工作台状态塞进 `chat.store.ts`。

原因：

- Chat state 和 Document Pipeline state 生命周期不同。
- Workbench 后续会扩展 Agent Debug、Document Management、Timeline 等能力。
- 分开 store 可以减少耦合。

## 决策 3：默认 includeGraph=false

决定：

Ingestion 默认：

```ts
{
  force: true,
  includeEmbedding: true,
  includeGraph: false,
}
```

原因：

- 本地演示最关键的是文档解析、Chunk、Embedding、Retrieval。
- Graph extraction 依赖 Neo4j 和 LLM Graph provider，更容易成为环境变量。
- 后续可以在 TASK-031/032 加 toggle。

## 决策 4：Workbench 使用标签页保留 Chat

决定：

DemoWorkbench 提供：

- `Pipeline` tab
- `Assistant` tab

Assistant tab 渲染现有 `ChatWindow`。

原因：

- 保留已有稳定 Chat UI。
- 避免本任务深度重构 Agent Chat。
- 演示时可以先 ingest，再切换 Chat 提问。

## 决策 5：不展示 DocumentContent 正文

决定：

Metadata 面板只展示 metadata，不展示 content。

原因：

- TASK-028 明确 metadata API 不返回正文。
- 前端演示关注处理闭环、hash、language、status、count，而不是全文阅读。

## 边界

不做：

- Agent Debug Workbench。
- Role / Permission 管理。
- 文档编辑。
- Graph 可视化。
- Pipeline retry / cancel。
- 大型 UI 框架引入。
