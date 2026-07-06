## 存架构记录

# TASK-007：Document Domain Technical Specification

## 1. Overview

本任务建立 Enterprise Agentic RAG 的 Document Domain。

Document 是 KnowledgeSpace 下一级核心知识实体。

注意：

Document != File

Document 表示业务知识对象。

File/ObjectStorage 只是 Document 的物理载体。

最终架构：

User

↓

ExecutionContext

↓

KnowledgeSpace

↓

Document

↓

Chunk

↓

Embedding

---

# 2. Goals

实现：

- Document 数据模型
- Document 生命周期管理
- Document CRUD API
- Space 与 Document 关系
- 基于 ExecutionContext 的权限过滤

---

# 3. Non Goals

本 TASK 不实现：

- 文件上传
- MinIO
- Parser
- OCR
- ASR
- Chunk
- Embedding
- Vector Database

这些属于后续 TASK。

---

# 4. Domain Model

## Document

字段：

id

唯一标识

spaceId

所属 KnowledgeSpace

title

文档名称

description

描述

type

文档类型

status

处理状态

storageKey

未来关联 MinIO Object

mimeType

文件类型

size

文件大小

createdBy

创建人

createdAt

updatedAt

---

# 5. Document Type

枚举：

PDF

WORD

TXT

MARKDOWN

IMAGE

AUDIO

VIDEO

---

# 6. Document Status

状态：

CREATED

PROCESSING

READY

FAILED

ARCHIVED

生命周期：

CREATED

↓

PROCESSING

↓

READY

异常：

PROCESSING

↓

FAILED

---

# 7. Database Design

新增：

Document Table

Relation:

KnowledgeSpace

1

|

N

Document

Document:

spaceId -> KnowledgeSpace.id

---

# 8. Permission Design

Document 不直接保存权限。

权限来源：

User

↓

SpaceMember

↓

KnowledgeSpace

↓

Document

创建：

OWNER

EDITOR

读取：

OWNER

EDITOR

VIEWER

删除：

OWNER

---

# 9. Architecture Rules

必须：

Controller

↓

Service

↓

Repository

↓

Prisma

禁止：

Controller直接访问数据库

Service直接调用Prisma

---

# 10. Future Extension

Document 后续连接：

Document

↓

MinIO Object

Document

↓

Parser Pipeline

Document

↓

Chunk

Chunk

↓

Embedding
