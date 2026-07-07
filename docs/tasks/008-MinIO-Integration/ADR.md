# ADR-010 Storage Provider Abstraction

## Status

Accepted

---

# Context

Document Domain 已建立。

但是Document需要保存真实文件。

如果业务代码直接依赖MinIO：

会导致：

- Storage强绑定
- 测试困难
- 未来迁移困难

---

# Decision

引入Storage Abstraction Layer。

架构：

Business

|

StorageService

|

Storage Provider

|

MinIO

---

# Rationale

## 1. 解耦业务与基础设施

Document不知道：

文件在哪里。

只保存：

storageKey

---

## 2. 支持未来多Provider

未来可以支持：

MinIO

AWS S3

Azure Blob

OSS

只需要替换Provider。

---

## 3. 符合DDD

Infrastructure负责：

外部系统交互。

Domain不依赖：

具体SDK。

---

# Consequences

优势：

- 可测试
- 可替换
- 易扩展

成本：

增加一层Service。

---

# Final Decision

All object storage access MUST go through StorageService.

No business module may import storage SDK directly.
