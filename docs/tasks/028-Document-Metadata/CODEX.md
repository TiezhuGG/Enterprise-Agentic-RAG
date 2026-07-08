# TASK-028：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请严格遵守 DDD 分层和现有目录结构，实现 Document Metadata & Chunk Metadata Propagation。

## 必须先阅读

在写代码前必须阅读：

```text
docs/tasks/028-Document-Metadata/SPEC.md
docs/tasks/028-Document-Metadata/SEQUENCE.md
docs/tasks/028-Document-Metadata/ADR.md
docs/tasks/028-Document-Metadata/REVIEW.md
docs/tasks/028-Document-Metadata/CODEX.md
```

## 目标

持久化 `DocumentContent.metadata`，并让 `Chunk.metadata` 继承文档级核心 metadata。

## 数据库要求

修改：

```text
apps/backend/prisma/schema.prisma
```

在 `DocumentContent` 新增：

```prisma
metadata Json @default("{}")
```

并新增 migration。

## 类型要求

更新：

```text
apps/backend/src/modules/document/entities/document-content.entity.ts
```

新增：

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

## Processing 要求

新增：

```text
apps/backend/src/modules/document-processing/metadata/
├── document-metadata.builder.ts
└── language.detector.ts
```

处理流程：

```text
StorageService.getObject()
-> ParserFactory.getParser()
-> parser.parse(buffer)
-> CleanerPipeline.clean(rawContent, context)
-> DocumentMetadataBuilder.build(document, object, cleanedContent, cleaningMetadata)
-> DocumentRepository.upsertContent(documentId, cleanedContent, metadata)
```

规则：

- `securityLevel = INTERNAL`
- `language` 使用启发式判断，不调用 LLM。
- `sourceHash` 基于原始 object buffer 计算 SHA-256。
- `contentHash` 基于 cleaned content 计算 SHA-256。
- metadata 中不保存正文。

## Repository 要求

修改：

```ts
upsertContent(
  documentId: string,
  content: string,
  metadata: DocumentContentMetadata,
)
```

Service 禁止直接访问 Prisma。

## Chunk 要求

`Chunk.metadata` 必须保留：

```ts
documentId;
sequence;
sectionTitle;
```

并新增：

```ts
spaceId;
documentType;
language;
securityLevel;
sourceHash;
contentHash;
```

## API 要求

新增：

```text
GET /documents/:id/metadata
```

返回：

```ts
{
  documentId: string;
  metadata: DocumentContentMetadata;
}
```

权限：

```text
OWNER / EDITOR / VIEWER
```

Controller 禁止访问 Repository / Prisma。

## 禁止

- 不实现 Pipeline Event / Job。
- 不实现 OCR / ASR / page number。
- 不实现密级策略引擎。
- 不修改 Retrieval ranking。
- 不修改 Agent prompt。
- 不引入 Elasticsearch / PGVector。
- 不在日志或 metadata 中记录正文。

## 验证

完成后执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
```

如数据库可用，建议执行：

```bash
pnpm db:migrate
pnpm db:seed
```

输出：

- 修改文件
- 新增目录
- Metadata 设计
- API 说明
- 测试结果
- 后续 TASK-029 接入建议
