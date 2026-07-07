# TASK-008 Object Storage Layer Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格按照DDD分层实现。

=========================

目标

=========================

建立统一对象存储基础设施层。

使用：

MinIO

但是业务层不能依赖MinIO SDK。

=========================

禁止

=========================

不要实现：

❌ Upload Controller

❌ Multipart上传

❌ Document绑定文件

❌ Parser

❌ OCR

❌ Chunk

❌ Embedding

=========================

目录

新增：

apps/backend/src/infrastructure/storage/

包含：

storage.module.ts

storage.service.ts

storage.client.ts

storage.types.ts

index.ts

=========================

StorageService

必须提供：

uploadObject(

key,

buffer,

contentType

)

getObject(

key

)

deleteObject(

key

)

exists(

key

)

=========================

MinIO

使用：

minio npm package

封装Client。

=========================

Configuration

使用已有ConfigService。

禁止：

process.env

=========================

Architecture Rules

必须：

Business Module

↓

StorageService

↓

MinIO Client

禁止：

DocumentService

↓

MinIO SDK

=========================

验证要求

完成后验证：

1.

MinIO连接成功

2.

Bucket自动创建

3.

上传测试Object成功

4.

读取Object成功

5.

删除Object成功

=========================

输出：

1. 新目录结构

2. Storage设计

3. MinIO配置

4. 测试方式

5. 后续如何接入Document
