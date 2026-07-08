# TASK-027 Document Cleaner & Normalization

## 目标

为 Document Processing Pipeline 增加统一文档清洗层，让 Parser 输出的原始文本在写入 `DocumentContent.content` 前经过规范化处理。

本任务只处理内容清洗，不扩展数据库、不引入异步任务、不改变 Retrieval / Agent。

目标链路：

```text
StorageService.getObject()
-> ParserFactory.getParser()
-> parser.parse(buffer)
-> CleanerPipeline.clean(rawContent, context)
-> DocumentRepository.upsertContent(cleanedContent)
```

## 背景

当前 Parser 直接输出文本并写入 `DocumentContent.content`。PDF、DOCX、TXT、MARKDOWN 的输出可能包含：

- 不统一的换行。
- 多余空行。
- 无效控制字符。
- 缺失 Markdown 标题。
- 不稳定的行尾空白。

这些问题会影响后续：

- Markdown Header Split。
- Token Split。
- Embedding。
- Graph Extraction。
- Citation 可读性。

## 新增结构

在现有模块内新增：

```text
apps/backend/src/modules/document-processing/
├── cleaners/
│   ├── cleaner.pipeline.ts
│   ├── document-cleaner.interface.ts
│   └── markdown.cleaner.ts
└── document-processing.types.ts
```

## Cleaner Pipeline

`CleanerPipeline` 是 `DocumentProcessingService` 内部依赖。

接口：

```ts
clean(rawContent: string, context: DocumentCleaningContext): DocumentCleaningResult
```

输入：

```ts
interface DocumentCleaningContext {
  documentId: string;
  title: string;
  type: DocumentType;
}
```

输出：

```ts
interface DocumentCleaningResult {
  content: string;
  metadata: {
    inputLength: number;
    outputLength: number;
    removedCharacterCount: number;
    addedTitleHeading: boolean;
  };
}
```

## 默认清洗规则

必须实现：

- 统一换行符为 `\n`。
- 移除无效控制字符。
- 去除普通 Markdown 行的行尾空白。
- 压缩普通 Markdown 区域连续空行为最多 2 行。
- 保留 Markdown heading。
- 保留 Markdown table。
- 保留 Markdown list。
- 保留 code fence 内部内容，不在 code fence 内压缩空行。
- 如果内容没有一级或二级标题，自动添加 `# {document.title}`。
- 清洗后内容为空时抛出异常，阻止写入 `DocumentContent`。

## 禁止

- 不新增数据库表。
- 不新增数据库字段。
- 不修改 `Chunk` schema。
- 不修改 `DocumentContent` schema。
- 不实现 Document Metadata。
- 不实现 Pipeline Event / Job。
- 不实现 OCR / ASR。
- 不实现 page number。
- 不修改 Retrieval。
- 不修改 Agent。
- 不把 Cleaner 逻辑写进 Parser。

## Observability

`DocumentProcessingService` 成功时记录清洗 metadata，但不得记录完整正文。

允许记录：

- `inputLength`
- `outputLength`
- `removedCharacterCount`
- `addedTitleHeading`

禁止记录：

- raw content
- cleaned content
- prompt
- answer
- API Key

## 验收标准

- Parser 输出会经过 `CleanerPipeline`。
- `DocumentContent.content` 写入 cleaned content。
- Markdown 已有一级或二级标题时不重复添加标题。
- TXT / PDF / DOCX 无标题文本会添加 `# {document.title}`。
- 连续空行最多保留 2 行。
- Markdown table / list / heading 不被破坏。
- code fence 内空行不被压缩。
- 清洗后空内容会导致 Document Processing 失败。
- 不改数据库 schema。
- 通过：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
