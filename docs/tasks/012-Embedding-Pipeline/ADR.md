# ADR-015 Embedding Provider Abstraction

## Status

Accepted

---

# Context

RAG系统需要将Chunk转换成向量。

Embedding模型可能变化：

当前：

OpenAI

未来：

BGE

Jina

本地模型

如果业务代码直接依赖：

OpenAI SDK

会导致：

模型绑定。

---

# Decision

采用Provider Pattern。

结构：

EmbeddingService

|

EmbeddingProvider Interface

|

Provider Implementation

---

# Example

EmbeddingService:

embedChunk(chunk)

调用：

provider.embed(content)

---

# Consequence

优点：

- 模型可替换

- 方便测试

- 支持私有部署

缺点：

增加一层抽象。

---

# Vector Storage Decision

第一版使用：

PostgreSQL + PGVector

原因：

- 已存在PostgreSQL

- 简化部署

- 企业常用

- 支持向量索引

未来：

可替换：

Milvus

Qdrant

Weaviate
