# TASK-009 Document Upload Pipeline Technical Specification

# 1. Overview

本任务实现知识文档上传能力。

目标：

将用户上传文件转换为：

Document + Object Storage

流程：

User Upload

↓

Upload Service

↓

StorageService

↓

MinIO

↓

Document.storageKey

---

# 2. Architecture

新增Application Layer：

Document Upload Application

结构：

Controller

↓

UploadService

↓

DocumentRepository

↓

StorageService

↓

MinIO

---

# 3. Design Principle

上传过程涉及：

数据库

-

对象存储

因此必须考虑事务一致性。

采用：

先创建Document

再上传Object

流程：

1.

创建Document

status=CREATED

2.

生成objectKey

3.

上传MinIO

4.

更新Document

storageKey

status=PROCESSING

---

# 4. New Module

新增：

apps/backend/src/modules/upload/

结构：

upload.module.ts

upload.controller.ts

upload.service.ts

upload.types.ts

dto/

upload-document.dto.ts

---

# 5. API Design

## Upload Document

POST

/spaces/:spaceId/documents/upload

Content-Type:

multipart/form-data

Form:

file

title?

description?

Response:

{
id,

title,

storageKey,

status

}

---

# 6. File Validation

必须校验：

## Size

默认：

50MB

配置化：

MAX_UPLOAD_SIZE

---

## Type

允许：

application/pdf

application/msword

application/vnd.openxmlformats-officedocument.wordprocessingml.document

text/plain

text/markdown

image/*

audio/*

video/*

---

# 7. Object Key Strategy

统一生成：

{spaceId}/{documentId}/{timestamp}/{filename}

Example:

space-001/

document-001/

1720000000/

manual.pdf

---

# 8. Document Lifecycle

上传成功：

CREATED

↓

PROCESSING

上传失败：

CREATED

↓

FAILED

---

# 9. Error Handling

如果：

MinIO上传失败

必须：

1.

Document状态FAILED

2.

记录错误日志

3.

不要产生孤儿Object

---

# 10. Permission

上传权限：

OWNER

EDITOR

必须基于：

ExecutionContext

---

# 11. Architecture Rules

禁止：

Controller直接调用MinIO

Controller直接操作Prisma

必须：

Controller

↓

UploadService

↓

Repository / StorageService
