# TASK-028：流程说明

## 正常文档处理流程

```text
Document(PROCESSING)
  ↓
DocumentProcessingService.processDocument(documentId)
  ↓
DocumentRepository.findActiveById(documentId)
  ↓
StorageService.getObject(storageKey)
  ↓
ParserFactory.getParser(document.type)
  ↓
DocumentParser.parse(buffer)
  ↓
CleanerPipeline.clean(rawContent, context)
  ↓
DocumentMetadataBuilder.build(document, object, cleanedContent, cleaningMetadata)
  ↓
DocumentRepository.upsertContent(documentId, cleanedContent, metadata)
  ↓
DocumentRepository.update(documentId, { status: READY })
  ↓
DocumentContent(content + metadata)
```

## Metadata 生成流程

```text
原始 object buffer
  ↓
SHA-256
  ↓
sourceHash

cleaned content
  ↓
SHA-256
  ↓
contentHash

cleaned content
  ↓
LanguageDetector.detect()
  ↓
language

Document + StoredObject + CleaningMetadata
  ↓
DocumentMetadataBuilder
  ↓
DocumentContentMetadata
```

生成的 metadata 只包含结构化描述信息，不包含正文内容。

## 语言检测流程

```text
cleaned content
  ↓
统计中文字符
  ↓
统计拉丁字母
  ↓
无中文且无英文 -> unknown
  ↓
仅中文 -> zh
  ↓
仅英文 -> en
  ↓
中英文都有 -> mixed
```

语言检测不调用 LLM，不依赖外部服务，保证文档处理链路稳定可运行。

## Chunk 处理流程

```text
ChunkService.processChunks(documentId)
  ↓
ChunkRepository.findDocumentContentByDocumentId(documentId)
  ↓
读取 DocumentContent.content
  ↓
读取 DocumentContent.metadata
  ↓
MarkdownHeaderSplitter
  ↓
TokenSplitter
  ↓
为每个 Chunk 写入：
  - documentId
  - sequence
  - sectionTitle
  - spaceId
  - documentType
  - language
  - securityLevel
  - sourceHash
  - contentHash
  ↓
ChunkRepository.createMany()
```

## Metadata API 流程

```text
GET /documents/:id/metadata
  ↓
JwtAuthGuard
  ↓
DocumentController
  ↓
RequestContextService.create(user)
  ↓
DocumentService.getMetadata(context, id)
  ↓
DocumentRepository.findActiveById(id)
  ↓
KnowledgeSpaceRepository.findAccessibleById(spaceId, userId)
  ↓
DocumentRepository.findContentByDocumentId(id)
  ↓
返回 { documentId, metadata }
```

## 错误流程

### Document 不存在

```text
findActiveById() 返回 null
  ↓
NotFoundException('Document not found')
```

### 用户无 Space 读权限

```text
KnowledgeSpace 不可访问或角色不在 OWNER/EDITOR/VIEWER
  ↓
ForbiddenException('Insufficient knowledge space role')
```

### DocumentContent 不存在

```text
Document 存在，但 content 尚未生成
  ↓
NotFoundException('Document metadata not found')
```

### 处理失败

```text
Parser / Cleaner / MetadataBuilder / Repository 任意异常
  ↓
Document.status = FAILED
  ↓
Observability 记录 error metadata
  ↓
异常继续向上抛出
```

## 与后续任务的衔接

TASK-029 Pipeline Event / Job 可以直接记录：

- metadata 生成耗时
- sourceHash / contentHash
- cleaner metadata
- chunk 数量
- embedding 数量
- 每个阶段状态

Evaluation 可以使用：

- `contentHash` 判断语料是否变化。
- `sourceHash` 判断源文件是否变化。
- `language` 选择评估 dataset。
- `securityLevel` 做引用覆盖和权限验证。
