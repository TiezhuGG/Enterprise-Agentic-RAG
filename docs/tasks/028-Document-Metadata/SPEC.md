# TASK-028：Document Metadata & Chunk Metadata Propagation

## 目标

TASK-028 负责将文档处理流水线生产化的第二步落地：持久化 `DocumentContent` 的文档级元数据，并让 `Chunk.metadata` 继承可检索、可引用、可评估的核心字段。

当前系统中 `DocumentContent.content` 是 Chunk、Embedding、Retrieval、Graph 和 Agent 的共同上游。TASK-027 已经完成 Cleaner，但清洗 metadata 只存在于处理过程。本任务把清洗结果、来源 hash、内容 hash、语言、安全等级等信息写入数据库，为后续 Pipeline Event、Evaluation、Citation、前端文档工作台打基础。

## 范围

新增或修改：

```text
docs/tasks/028-Document-Metadata/
├── SPEC.md
├── SEQUENCE.md
├── ADR.md
├── REVIEW.md
└── CODEX.md

apps/backend/prisma/schema.prisma
apps/backend/prisma/migrations/

apps/backend/src/modules/document/
├── document.controller.ts
├── document.repository.ts
├── document.service.ts
└── entities/
    └── document-content.entity.ts

apps/backend/src/modules/document-processing/
├── document-processing.module.ts
├── document-processing.service.ts
└── metadata/
    ├── document-metadata.builder.ts
    └── language.detector.ts

apps/backend/src/modules/chunk/
├── chunk.entity.ts
├── chunk.repository.ts
└── chunk.service.ts
```

## 数据库变更

`DocumentContent` 新增 JSON 字段：

```prisma
model DocumentContent {
  id         String   @id @default(cuid())
  documentId String   @unique @map("document_id")
  content    String
  metadata   Json     @default("{}")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@map("document_contents")
}
```

## DocumentContent Metadata Schema

```ts
interface DocumentContentMetadata {
  documentId: string;
  spaceId: string;
  documentType: DocumentType;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  language: 'zh' | 'en' | 'mixed' | 'unknown';
  securityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  sourceHash: string;
  contentHash: string;
  contentLength: number;
  lineCount: number;
  parser: string;
  cleaner: {
    inputLength: number;
    outputLength: number;
    removedCharacterCount: number;
    addedTitleHeading: boolean;
  };
  processedAt: string;
}
```

默认策略：

- `securityLevel` 默认 `INTERNAL`。
- `language` 使用轻量启发式判断，不调用 LLM。
- `sourceHash` 基于原始 object buffer 计算 SHA-256。
- `contentHash` 基于 cleaned content 计算 SHA-256。
- metadata 中不保存原始正文、完整 prompt、完整 answer。
- 不实现 page number，后续交给 PDF layout、OCR、ASR 或 Pipeline Event 扩展。

## Document Processing 流程

```text
StorageService.getObject()
-> ParserFactory.getParser()
-> parser.parse(buffer)
-> CleanerPipeline.clean(rawContent, context)
-> DocumentMetadataBuilder.build(document, object, cleanedContent, cleaningMetadata)
-> DocumentRepository.upsertContent(documentId, cleanedContent, metadata)
-> Document.status = READY
```

失败时仍保持现有策略：

```text
异常
-> Document.status = FAILED
-> Observability 记录错误 metadata
-> 抛出异常
```

## Chunk Metadata Schema

每个 Chunk 继续保留已有字段，并继承文档级 metadata：

```ts
interface ChunkMetadata {
  documentId: string;
  sequence: number;
  sectionTitle: string;
  spaceId: string;
  documentType: string;
  language: string;
  securityLevel: string;
  sourceHash: string;
  contentHash: string;
}
```

## API

新增只读 API：

```text
GET /documents/:id/metadata
```

返回：

```ts
interface DocumentMetadataResponse {
  documentId: string;
  metadata: DocumentContentMetadata;
}
```

权限：

```text
OWNER / EDITOR / VIEWER
```

Controller 只负责接收请求、构造 `ExecutionContext`、调用 Service；权限检查复用 `DocumentService` 的文档读权限。

## 禁止项

- 不新增 Pipeline Event / Job。
- 不实现 OCR / ASR / page number。
- 不实现真实文档密级策略引擎。
- 不修改 Retrieval ranking。
- 不修改 Agent prompt。
- 不新增多租户模型。
- 不引入 Elasticsearch / PGVector。
- 不把正文写入 metadata 日志。
- 不让 Controller 访问 Repository、Prisma、Storage 或 Provider。
- 不让 Service 直接访问 Prisma。

## 验收标准

- `DocumentContent.metadata` 可以被 Prisma schema 校验。
- `DocumentRepository.upsertContent()` 同时保存 cleaned content 和 metadata。
- `GET /documents/:id/metadata` 不返回正文内容。
- `sourceHash` 基于原始 object buffer。
- `contentHash` 基于 cleaned content。
- 中文、英文、混合文本能得到稳定语言结果。
- `securityLevel` 默认 `INTERNAL`。
- `Chunk.metadata` 包含文档级字段，并保留 `documentId / sequence / sectionTitle`。
- 现有 Ingestion、Chunk、Embedding、Retrieval、Agent 流程不被破坏。

## 验证命令

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
```

推荐在本地数据库可用时执行：

```bash
pnpm db:migrate
pnpm db:seed
```

可选 Smoke：

```bash
pnpm demo:ingest <documentId> <userId> <spaceId> --force --no-graph
```
