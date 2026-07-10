# TASK-055：架构决策

## 决策 1：新增业务模块 `modules/search`

Search API 是产品能力，不放在 infrastructure/search 中。Infrastructure search 仍只负责 Elasticsearch client / index / query。

后果：

- API 层语义清晰。
- Controller 不接触 ES / pgvector。

## 决策 2：复用 RetrievalService 做权限过滤

不为 Search API 重写 tenant、space、securityLevel、department 过滤逻辑。

后果：

- 权限边界统一。
- 后续 Retrieval Refactor 不需要重复改 Search API。

## 决策 3：Fulltext / Semantic 不强制 Reranker

全文和语义搜索应能独立工作，不依赖 reranker provider。Hybrid 继续使用 RRF + Reranker。

后果：

- 模型服务部分降级时仍可做全文搜索。
- Hybrid 仍保持最高质量路径。

## 决策 4：第一版 offset 分页在 Service 层完成

为了复用 RetrievalService，第一版使用 `offset + limit` 取回后切片。

后果：

- 实现简单，可演示。
- 大规模深分页留给后续 Search Result Page / Elasticsearch 产品化任务。

## 决策 5：返回来源文档摘要，不返回完整 DocumentContent

结果包含 document id/title/type/status/updatedAt 和 chunk snippet，不返回完整正文。

后果：

- 满足引用来源展示。
- 避免 Search API 泄露过多内容。
