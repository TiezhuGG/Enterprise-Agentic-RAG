# TASK-027 Codex Prompt

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请实现 Document Cleaner & Normalization。

## 必须先阅读

```text
docs/tasks/027-Document-Cleaner/SPEC.md
docs/tasks/027-Document-Cleaner/SEQUENCE.md
docs/tasks/027-Document-Cleaner/ADR.md
docs/tasks/027-Document-Cleaner/REVIEW.md
docs/tasks/027-Document-Cleaner/CODEX.md
```

## 目标

在 `DocumentProcessingService` 中加入统一 Cleaner Pipeline：

```text
StorageService.getObject()
-> ParserFactory.getParser()
-> parser.parse(buffer)
-> CleanerPipeline.clean(rawContent, context)
-> DocumentRepository.upsertContent(cleanedContent)
```

## 新增文件

```text
apps/backend/src/modules/document-processing/
├── cleaners/
│   ├── cleaner.pipeline.ts
│   ├── document-cleaner.interface.ts
│   └── markdown.cleaner.ts
└── document-processing.types.ts
```

## 必须实现

- 统一换行符为 `\n`。
- 移除无效控制字符。
- 去除普通 Markdown 行的行尾空白。
- 压缩普通 Markdown 区域连续空行为最多 2 行。
- 保留 Markdown heading、table、list。
- 保留 code fence 内部内容，不压缩 code fence 内空行。
- 如果内容没有一级或二级标题，自动添加 `# {document.title}`。
- 清洗后内容为空则抛出异常。
- 记录 cleaning metadata，但不记录正文。

## 禁止

- 不新增数据库表。
- 不新增数据库字段。
- 不修改 Chunk schema。
- 不修改 Retrieval。
- 不修改 Agent。
- 不实现 Metadata / Event / Job。
- 不实现 OCR / ASR。
- 不把 Cleaner 写进 Parser。
- 不使用 `process.env`。

## 验证

必须执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

推荐执行：

```text
pnpm db:validate
```

## 输出

完成后输出：

- 修改文件列表。
- Cleaner 设计说明。
- 流程变化。
- 验证结果。
- 后续 TASK-028 建议。
