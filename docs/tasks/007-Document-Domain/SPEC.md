## 存项目docs

# TASK-007：Document Domain

你是 Enterprise Agentic RAG 项目的开发工程师。

严格按照架构设计实现。

=========================
目标
=========================

建立 Knowledge Document Domain。

Document 是 KnowledgeSpace 下一级知识实体。

不是文件对象。

不要实现上传。

不要实现解析。

=========================

数据库新增：

Document

字段：

id

spaceId

title

description

type

status

storageKey?

mimeType?

size?

createdBy

createdAt

updatedAt

Enum:

DocumentType:

PDF
WORD
TXT
MARKDOWN
IMAGE
AUDIO
VIDEO

DocumentStatus:

CREATED
PROCESSING
READY
FAILED
ARCHIVED

=========================

Backend:

新增：

modules/document/

包含：

controller

service

repository

module

dto

entities

=========================

API:

POST /spaces/:spaceId/documents

GET /spaces/:spaceId/documents

GET /documents/:id

PATCH /documents/:id

DELETE /documents/:id

=========================

权限：

创建:

OWNER/EDITOR

读取:

OWNER/EDITOR/VIEWER

删除:

OWNER

必须基于：

ExecutionContext.spaceIds

=========================

禁止：

MinIO

Upload

Parser

Chunk

Embedding

=========================

架构要求：

Controller不能写业务。

Service不能访问Prisma。

Repository负责数据库。

输出：

1. 数据库设计

2. API设计

3. Document生命周期

4. 与KnowledgeSpace关系

5. 后续如何接入MinIO
