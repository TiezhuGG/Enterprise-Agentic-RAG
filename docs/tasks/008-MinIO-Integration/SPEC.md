# TASK-008 Object Storage Layer Technical Specification

# 1. Overview

本任务建立 Enterprise Agentic RAG 的对象存储基础设施层。

目标：

为未来 Document 文件存储提供统一 Storage 抽象。

架构：

Document

|

storageKey

|

StorageService

|

MinIO

---

# 2. Design Goal

实现：

- MinIO Client封装
- Bucket初始化
- Object上传能力
- Object读取能力
- Object删除能力
- Storage Provider抽象

---

# 3. Non Goals

本任务不实现：

- HTTP Upload API

- 文件上传业务

- Document更新

- Parser

- OCR

- ASR

- Chunk

- Embedding

---

# 4. Architecture

新增Infrastructure Layer：

apps/backend/src/infrastructure/storage/

结构：

storage.module.ts

storage.service.ts

storage.client.ts

storage.types.ts

index.ts

---

# 5. Storage Abstraction

业务层禁止直接依赖MinIO SDK。

必须通过：

StorageService

调用。

例如：

DocumentService

|

StorageService

|

MinIOClient

---

# 6. StorageService API

interface:

uploadObject(

key,

buffer,

contentType

)

返回：

objectKey

---

getObject(

key

)

返回：

Buffer

---

deleteObject(

key

)

---

exists(

key

)

返回：

boolean

---

# 7. MinIO Configuration

使用已有Config系统。

新增配置：

MINIO_BUCKET

MINIO_ENDPOINT

MINIO_ACCESS_KEY

MINIO_SECRET_KEY

---

# 8. Bucket Strategy

默认Bucket：

knowledge

未来支持：

tenant-space-document

例如：

tenant-a/hr/manual.pdf

---

# 9. Security Rules

业务模块：

禁止：

import minio

只能：

inject StorageService

---

# 10. Future Extension

TASK-009:

Upload Pipeline

流程：

HTTP Upload

|

StorageService

|

MinIO

|

Document.storageKey
