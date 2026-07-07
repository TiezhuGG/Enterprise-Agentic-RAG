# ADR-014 Hybrid Chunking Strategy

## Status

Accepted

---

# Context

知识文档长度不可控。

如果：

整篇Document生成Embedding：

问题：

- 超过context限制

- 检索粒度过粗

- 相关性下降

因此需要Chunk。

---

# Decision

采用Hybrid Chunking。

流程：

Markdown Structure Split

↓

Token Split

↓

Overlap

---

# Why Markdown First?

因为：

Parser阶段已经转换Markdown。

Markdown天然包含：

标题

章节

列表

比纯文本更适合保持语义。

---

# Why Token Split?

因为：

LLM和Embedding模型：

基于token计费和限制。

---

# Why Overlap?

避免：

一句话被切断。

例如：

Chunk A:

"员工请假需要提交..."

Chunk B:

"...提交审批流程"

Overlap保持上下文。

---

# Consequence

优点：

- 查询准确

- 结构保留

- Embedding友好

缺点：

Chunk数量增加。
