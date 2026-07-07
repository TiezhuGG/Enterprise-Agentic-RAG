# ADR-018 Reranker Layer Architecture

## Status

Accepted

---

# Context

Hybrid Retrieval解决召回问题。

但是：

召回排序依赖：

Vector similarity

-

Keyword rank

无法真正理解：

query-document相关性。

---

# Decision

增加独立Reranker层。

Architecture:

Retrieval

↓

RRF

↓

Reranker

↓

Context

---

# Why not inside Retrieval?

原因：

Retrieval负责：

找到候选

Reranker负责：

判断相关性

职责不同。

---

# Provider Pattern

采用：

RerankerProvider

原因：

模型可能变化：

BGE-Reranker

↓

Cohere Rerank

↓

Jina Reranker

业务无需修改。

---

# Candidate Size

RRF:

Top 20

Reranker:

Top 5

原因：

Reranker计算成本高。

---

# Context Budget

LLM上下文有限。

因此：

ContextBuilder负责：

Token控制。

策略：

score排序

↓

token累计

↓

超过预算停止

---

# Consequence

优点：

- 提升RAG准确率

- 模型可替换

- 控制token成本

缺点：

增加一次模型调用。
