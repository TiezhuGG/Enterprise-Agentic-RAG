# ADR-017 Hybrid Retrieval Architecture

## Status

Accepted

---

# Context

单一检索方式存在问题。

Vector Search:

优点：

理解语义

缺点：

关键词精确匹配弱。

Keyword Search:

优点：

精确匹配强

缺点：

无法理解语义。

因此采用Hybrid Retrieval。

---

# Decision

采用双路召回：

Vector Retrieval

-

Keyword Retrieval

然后：

RRF融合。

---

# Vector Strategy

Query:

↓

EmbeddingProvider

↓

Vector Search

---

# Keyword Strategy

MVP:

PostgreSQL Full Text Search

未来：

Elasticsearch BM25

---

# Why RRF?

相比固定权重：

RRF:

- 不依赖分数归一化

- 适合异构检索结果

- 工程实现简单

---

# Permission Decision

权限过滤必须位于：

Retrieval Pipeline内部。

禁止：

先返回结果

再过滤。

原因：

防止越权信息进入LLM上下文。

---

# Consequence

优点：

- 高召回率

- 易扩展

- 企业权限友好

缺点：

需要维护多路检索。
