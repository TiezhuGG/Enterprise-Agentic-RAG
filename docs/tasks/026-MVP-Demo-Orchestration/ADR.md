# TASK-026 ADR

## 决策 1：新增 Ingestion 模块，而不是把编排写进 DocumentService

### 背景

当前 `DocumentService` 负责文档领域 CRUD 与 Space 权限判断。解析、分块、向量化、图谱抽取分别属于不同模块。

如果把完整入库链路塞进 `DocumentService`，该 Service 会变成上帝对象。

### 决策

新增：

```text
apps/backend/src/modules/ingestion/
```

`IngestionService` 只负责编排，不直接处理 parser、embedding、graph 的内部细节。

### 后果

好处：

- 保持现有模块职责清晰。
- Demo 闭环有统一入口。
- 后续可以把同步 IngestionService 替换成队列任务，而不影响 Document / Chunk / Embedding / Graph 模块。

代价：

- 新增一个业务编排模块。
- 需要认真处理各阶段失败后的 Document 状态一致性。

## 决策 2：第一版采用同步入库，不引入队列

### 背景

生产系统通常会用队列处理文档解析和向量化。但当前目标是可部署、可演示 MVP，而不是高并发文档处理平台。

### 决策

第一版：

```text
POST /documents/:id/ingest
```

同步执行完整入库链路。

### 后果

好处：

- 实现简单。
- Demo 可控。
- 错误定位清晰。
- 不新增 Redis Queue / Worker 复杂度。

代价：

- 大文档可能导致请求时间较长。
- 不适合高并发生产导入。

后续可以演进为：

```text
POST /documents/:id/ingest-jobs
GET /ingest-jobs/:id
```

## 决策 3：不新增 IngestionJob 数据表

### 背景

当前已有：

- Document.status
- DocumentContent
- Chunk
- ChunkEmbedding
- Neo4j graph
- Observability metrics/log

MVP 阶段可以从这些事实数据推导入库状态。

### 决策

TASK-026 不新增 `IngestionJob` 表。

状态接口通过 `IngestionRepository` 查询：

- Document
- DocumentContent 是否存在
- Chunk 数量
- ChunkEmbedding 数量

Graph 数量通过 Graph infrastructure 或 KnowledgeGraphRepository 查询，若第一版成本过高，可返回最近一次 graph stage 结果。

### 后果

好处：

- 避免数据库模型膨胀。
- 与当前任务“闭环完善”目标一致。

代价：

- 不能展示细粒度后台任务进度。
- 服务重启后无法恢复某次 stage 级执行历史。

## 决策 4：Graph 默认参与闭环，但允许关闭

### 背景

项目卖点之一是 GraphRAG。Demo 应该展示 graph context 进入 Agent。

但 Neo4j 或 LLM graph extraction 在本地环境中可能更容易失败。

### 决策

`includeGraph` 默认 `true`。

调用方可以显式传入：

```json
{
  "includeGraph": false
}
```

关闭 graph stage。

### 后果

好处：

- 默认演示完整 GraphRAG。
- 本地排障时可以先跑通最小 RAG 闭环。

代价：

- 文档和 Demo Script 必须清楚说明两种模式。

## 决策 5：真实服务 Smoke 不允许 mock fallback

### 背景

这个项目要用于简历和部署演示。若 Smoke 使用 mock，无法证明真实 LLM / Embedding / Reranker 链路可用。

### 决策

`pnpm demo:smoke` 必须使用 `.env` 中真实配置。

失败时直接失败，并输出：

- 服务名
- endpoint host
- model 名称
- 错误摘要

禁止输出：

- API Key
- 完整 prompt
- 完整 answer
- 文档全文

### 后果

好处：

- Demo 可信。
- 面试时可以讲清楚真实服务依赖。

代价：

- 本地没有模型服务时 Smoke 会失败。
- 需要准备真实 OpenAI-compatible 服务。

## 决策 6：暂不做前端文档管理后台

### 背景

当前前端已有 Assistant UI、Conversation、Streaming、Trace、Citation、Attachment。

完整文档管理后台会引入较多 UI 工作。

### 决策

TASK-026 先完成后端闭环、Demo 脚本和文档。

前端最小文档管理界面作为后续任务：

```text
TASK-027 Demo Console UI
```

### 后果

好处：

- TASK-026 聚焦闭环主链路。
- 降低一次任务的实现风险。

代价：

- 演示上传和入库仍可能需要 API 工具或脚本辅助。

## 决策 7：不在本任务替换检索底座

### 背景

方案文档中提到 ElasticSearch BM25 和 PGVector。当前项目实现是：

- PostgreSQL Full Text Search
- Prisma `Float[]` 存储 embedding
- VectorService 封装相似度检索

### 决策

TASK-026 不替换为 Elasticsearch 或 pgvector。

### 后果

好处：

- 避免破坏已完成链路。
- MVP 部署依赖更少。

代价：

- 简历描述需要准确，不能写“已接入 Elasticsearch”或“已接入 pgvector”，除非后续单独实现。
