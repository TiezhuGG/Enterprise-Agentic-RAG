# TASK-049：Multimodal Indexing

## 目标

让 IMAGE / AUDIO / VIDEO 知识库文档进入现有 ingestion 链路，最终产出 DocumentContent、Chunk、Embedding，并可被 Retrieval 返回。

## 范围

- 在 `document-processing` 中新增 `image.parser.ts`、`audio.parser.ts`、`video.parser.ts`。
- Parser 复用 OCR / ASR / Video provider。
- Ingestion 支持 IMAGE / AUDIO / VIDEO。
- 上传 MIME 白名单补齐图片、音频、视频。
- Chunk metadata / citation metadata 保持现有传播。

## 禁止

- Chat 附件自动进入知识库索引。
- Retrieval 直接读取 MinIO。
- Agent 处理二进制。
- Controller 访问 provider 或 storage。

## 验收标准

- IMAGE/AUDIO/VIDEO 文档上传后可 ingest。
- `DocumentContent.content` 为 provider 输出的 Markdown 文本。
- Chunk 和 Embedding 正常生成。
- Retrieval 能返回多模态文档 chunk。
- tenant/access-policy 仍生效。
