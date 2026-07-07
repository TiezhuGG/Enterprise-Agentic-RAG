# Enterprise Agentic RAG

Enterprise Agentic RAG 是面向企业级 Agentic RAG 系统的 monorepo 工程骨架。

当前已完成：

- TASK-001 Monorepo 结构初始化
- TASK-002 统一配置系统与环境策略
- TASK-003 Prisma 与数据库访问层
- TASK-004 JWT 认证系统
- TASK-005 面向知识检索的轻量 RBAC
- TASK-006 Enterprise Knowledge Space
- TASK-007 Knowledge Document Domain
- TASK-008 Object Storage Layer
- TASK-009 Document Upload Pipeline
- TASK-010 Document Processing Pipeline
- TASK-011 Semantic Chunking Pipeline

当前边界：已实现 Knowledge Space、Document 元数据、对象存储、Document 上传编排、Document 解析流水线和 Markdown 语义分块；尚未实现 Embedding、Vector Database、Elasticsearch、Retrieval、OCR、ASR、Video Understanding 或 Agent。

## 目录结构

```text
apps/backend/src/
|-- common/request-context/
|-- config/
|-- infrastructure/
|   |-- prisma/
|   `-- storage/
|-- modules/
|   |-- auth/
|   |-- chunk/
|   |   |-- splitters/
|   |   |   |-- markdown-header.splitter.ts
|   |   |   `-- token.splitter.ts
|   |   |-- chunk.entity.ts
|   |   |-- chunk.module.ts
|   |   |-- chunk.repository.ts
|   |   |-- chunk.service.ts
|   |   |-- chunk.types.ts
|   |   `-- index.ts
|   |-- document/
|   |-- document-processing/
|   |   `-- parsers/
|   |-- knowledge-space/
|   |-- upload/
|   `-- user/
|-- app.module.ts
`-- main.ts
```

## 架构边界

数据库访问链路：

```text
Controller -> Service -> Repository -> PrismaService -> Prisma Client -> DB
```

对象存储链路：

```text
Business Module -> StorageService -> StorageClient -> MinIO Client
```

解析流水线：

```text
DocumentProcessingService
-> DocumentRepository
-> StorageService
-> ParserFactory
-> DocumentParser
-> DocumentRepository
```

分块流水线：

```text
ChunkService
-> ChunkRepository
-> PrismaService
-> DB
```

约束：

- Prisma 只存在于 `apps/backend/src/infrastructure/prisma`。
- MinIO SDK 只存在于 `apps/backend/src/infrastructure/storage/storage.client.ts`。
- 业务模块不直接依赖 MinIO SDK。
- Processing Pipeline 不直接调用 Prisma 或 MinIO SDK。
- Chunk Pipeline 不读取 MinIO，不实现 Embedding、Vector Database、Elasticsearch、Retrieval 或 Agent。
- 所有环境变量必须通过后端 `ConfigService` 或前端 `lib/env.ts` 访问。

## 数据模型

已实现模型：

```text
User
Role
Permission
UserRole
RolePermission
KnowledgeSpace
SpaceMember
Document
DocumentContent
Chunk
```

`Document` 是 KnowledgeSpace 下一级核心知识实体。

```text
Document
- id
- spaceId
- title
- description
- type: PDF | WORD | TXT | MARKDOWN | IMAGE | AUDIO | VIDEO
- status: CREATED | PROCESSING | READY | FAILED | ARCHIVED
- storageKey?
- mimeType?
- size?
- createdBy
- createdAt
- updatedAt
```

`DocumentContent` 保存解析后的 Markdown 内容，和 Document 一对一。

```text
DocumentContent
- id
- documentId
- content
- createdAt
- updatedAt
```

`Chunk` 保存从 DocumentContent 切分出的语义块，和 Document 多对一。

```text
Chunk
- id
- documentId
- content
- sequence
- tokenCount
- metadata
- createdAt
- updatedAt
```

关系：

- `Document.spaceId -> KnowledgeSpace.id`
- `Document.createdBy -> User.id`
- `DocumentContent.documentId -> Document.id`
- `Chunk.documentId -> Document.id`
- `Chunk` 通过 `(documentId, sequence)` 保证同一文档内顺序唯一

## Document Upload

上传接口：

```text
POST /spaces/:spaceId/documents/upload
Content-Type: multipart/form-data
```

表单字段：

```text
file
title?
description?
```

上传状态：

```text
CREATED -> PROCESSING
CREATED -> FAILED
```

上传成功后写入：

```text
storageKey = {spaceId}/{documentId}/{timestamp}/{filename}
status = PROCESSING
```

## Parser 设计

统一接口：

```ts
interface DocumentParser {
  supports(type: DocumentType): boolean;
  parse(buffer: Buffer): Promise<string>;
}
```

当前解析器：

```text
PDF      -> PdfParser      -> pdf-parse
WORD     -> DocxParser     -> mammoth
TXT      -> TxtParser      -> utf8 text
MARKDOWN -> MarkdownParser -> utf8 markdown
```

不支持 `IMAGE`、`AUDIO`、`VIDEO` 的解析；这些类型后续需要 OCR、ASR 或 Video Understanding，本阶段明确不实现。

## Processing Pipeline

内部服务方法：

```ts
processDocument(documentId);
```

处理流程：

```text
1. 读取 Document
2. 校验 Document.status = PROCESSING
3. 获取 storageKey
4. StorageService.getObject(storageKey)
5. ParserFactory 根据 Document.type 选择 Parser
6. Parser 生成 Markdown
7. DocumentRepository.upsertContent(documentId, markdown)
8. Document.status = READY
```

失败处理：

```text
任意异常 -> Document.status = FAILED -> Logger 记录错误
```

状态变化：

```text
PROCESSING -> READY
PROCESSING -> FAILED
```

## Chunk Pipeline

内部服务方法：

```ts
processChunks(documentId);
```

处理流程：

```text
1. 读取 DocumentContent.content
2. 删除旧 Chunk
3. Markdown Header Split
4. Token Split
5. 计算 token 数量
6. 生成 metadata
7. 批量保存 Chunk
```

默认分块参数：

```text
chunkSize = 500 tokens
overlap = 100 tokens
```

Metadata：

```json
{
  "documentId": "document-id",
  "sequence": 1,
  "sectionTitle": "Section title"
}
```

切分策略：

- 第一层：按 Markdown `#`、`##`、`###` 标题切分，保留章节语义。
- 第二层：对超长章节做 token 窗口切分。
- 第三层：相邻窗口保留 100 token overlap，降低上下文断裂。

后续 Embedding Pipeline 应直接读取 `Chunk`：

```text
Chunk
-> EmbeddingService
-> Vector Store
-> Retrieval
```

Embedding 阶段应复用 `documentId`、`sequence`、`metadata.sectionTitle`，并保持 `Chunk` 可追溯到 `Document` 与 `KnowledgeSpace`。

## 启动方式

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm dev:backend
pnpm dev:frontend
```

常用检查：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

seed 管理员账号：

```text
email: admin@example.com
password: Admin123!
```
