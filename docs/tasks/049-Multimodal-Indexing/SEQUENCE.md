# TASK-049：流程

## 正常流程

1. 用户上传 IMAGE / AUDIO / VIDEO 到 Knowledge Space。
2. UploadService 创建 Document 并存储 object。
3. 用户触发 `/documents/:id/ingest`。
4. Ingestion 校验文档类型支持。
5. DocumentProcessingService 读取 MinIO object。
6. ParserFactory 选择多模态 parser。
7. Parser 调用对应 provider 生成 Markdown。
8. Cleaner 清洗文本。
9. DocumentContent 写入。
10. Chunk、Embedding、Retrieval 复用现有流程。

## 失败流程

- provider 失败：document 标记为 `FAILED`，pipeline event 记录失败原因。
- 提取结果为空：Cleaner 阻止处理并失败。

## 权限流程

- Upload/Ingestion 仍由 Space OWNER/EDITOR 触发。
- Retrieval 仍使用 tenant/access-policy 过滤。
