# TASK-044：架构决策记录

## 决策 1：使用 Search Infrastructure 隔离 Elasticsearch

Elasticsearch 属于基础设施能力，不属于 Retrieval 领域本身。

因此新增：

```text
infrastructure/search
```

业务模块只能依赖 `SearchService`，不能直接调用 Elasticsearch HTTP 或 SDK。

后果：

- 后续替换 OpenSearch、Meilisearch 或云厂商 ES 时，影响范围收敛在 infrastructure。
- RetrievalService 保持编排角色，不被搜索引擎细节污染。

## 决策 2：第一版使用内置 fetch，不引入 Elasticsearch SDK

本项目当前目标是可部署、可演示 MVP。引入 SDK 会增加依赖和版本维护成本。

第一版 `SearchClient` 使用 Node 运行时内置 `fetch` 调用 Elasticsearch REST API。

后果：

- 少一个外部依赖。
- SearchClient 需要自己处理少量 HTTP status 和 bulk payload。
- 如果后续需要高级能力，可以只在 `SearchClient` 内替换为官方 SDK。

## 决策 3：DB 是 source of truth，ES 是检索索引

Chunk 的权威数据仍在 PostgreSQL。

Elasticsearch 只用于 BM25 keyword retrieval。

后果：

- ES 数据可通过 reindex 重建。
- 删除或重建 index 不影响业务主数据。
- Ingestion 需要在 chunking 后同步索引。

## 决策 4：保留 PostgreSQL FTS fallback

Elasticsearch 是外部依赖，本地 demo 或 CI 可能没有启动。

第一版保留 FTS fallback，受 `ELASTICSEARCH_ENABLE_FALLBACK` 控制。

后果：

- 本地演示更稳。
- 如果想强制验证 ES，可设置 fallback=false。
- Retrieval 输出来源仍标记为 `keyword`，不把 fallback 细节暴露给 Agent。

## 决策 5：权限过滤仍在 Retrieval / AccessPolicy 层

Elasticsearch 查询必须带 `spaceIds` filter，但最终权限仍由现有 `AccessPolicyService` 统一判断。

后果：

- tenant / securityLevel / department 权限不会散落到 ES query DSL 中。
- ES 先做粗过滤，业务层再做最终过滤。
- 后续如需性能优化，可以把更多 policy 条件下推到 SearchService，但必须保持 AccessPolicy 为权威。

## 决策 6：不新增数据库模型

TASK-044 不需要新增 DB 表。

Index 状态、同步状态暂不持久化。

后果：

- 实现简单。
- 如果需要可视化 index sync 状态，可在后续 Observability 或 Pipeline Event 中扩展。
