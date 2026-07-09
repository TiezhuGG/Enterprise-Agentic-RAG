# TASK-046：流程

## 正常流程

1. 用户调用 `POST /multimodal/attachments` 上传图片。
2. `MultimodalService` 校验文件、conversation 归属和 MIME。
3. 文件落入 MinIO。
4. 创建 `MultimodalAttachment`，状态为 `CREATED`。
5. `MultimodalProvider` 将 IMAGE 请求分发到 `OcrProvider`。
6. OCR provider 返回 Markdown 文本和安全 metadata。
7. Repository 更新 `extractedText`、`metadata`、`status=EXTRACTED`。
8. Chat 构建 prompt 时只读取 `extractedText`。

## 失败流程

1. MinIO 上传失败：不创建可用附件，返回上传失败。
2. OCR provider 失败：附件状态更新为 `FAILED`。
3. Chat 使用未完成附件：返回附件未就绪。

## 安全流程

- 不记录图片正文。
- 不记录 API key。
- 不把 buffer 传给 Agent、Retrieval 或 PromptBuilder。
