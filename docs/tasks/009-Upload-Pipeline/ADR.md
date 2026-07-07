# ADR-012 Document Upload Consistency Strategy

## Status

Accepted

---

# Context

上传文件涉及两个系统：

Database

-

Object Storage

两者无法共享数据库事务。

因此必须设计一致性策略。

---

# Decision

采用：

Document First

流程：

Create Document

↓

Upload Object

↓

Update Document

---

# State Machine

成功：

CREATED

↓

PROCESSING

失败：

CREATED

↓

FAILED

---

# Rationale

为什么不是：

先上传MinIO？

因为：

如果：

Object上传成功

但是：

Database失败

会产生：

孤儿文件。

---

# Why Document First?

因为Document拥有业务生命周期。

Object只是资源。

业务状态应该由Document控制。

---

# Future Evolution

未来引入：

Async Pipeline:

Upload

↓

Queue

↓

Worker

↓

Parser

↓

Chunk
