# TASK-007：Document Domain Implementation

你是 Enterprise Agentic RAG 项目的开发工程师。

必须严格遵守架构。

=========================

目标

=========================

建立 Knowledge Document Domain。

Document 是 KnowledgeSpace 下一级核心知识实体。

注意：

Document != File

不要实现文件上传。

=========================

禁止实现

=========================

❌ MinIO

❌ Upload

❌ Parser

❌ OCR

❌ Chunk

❌ Embedding

❌ Vector Database

=========================

Database

=========================

新增：

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

Backend Structure

=========================

新增：

apps/backend/src/modules/document/

包含：

document.module.ts

document.controller.ts

document.service.ts

document.repository.ts

dto/

create-document.dto.ts

update-document.dto.ts

entities/

document.entity.ts

=========================

API

=========================

实现：

POST /spaces/:spaceId/documents

创建Document

GET /spaces/:spaceId/documents

查询Space下Document

GET /documents/:id

查询详情

PATCH /documents/:id

更新

DELETE /documents/:id

删除

=========================

Permission

创建：

OWNER

EDITOR

读取：

OWNER

EDITOR

VIEWER

删除：

OWNER

权限判断必须基于：

ExecutionContext

=========================

Architecture Rules

必须：

Controller

↓

Service

↓

Repository

↓

Prisma

禁止：

Controller访问Prisma

Service访问Prisma

=========================

输出要求

完成后输出：

1. 数据库设计

2. 新目录结构

3. API设计

4. Document生命周期

5. 与KnowledgeSpace关系

6. 后续如何接入MinIO
