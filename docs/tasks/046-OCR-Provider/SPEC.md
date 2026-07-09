# TASK-046：OCR Provider

## 目标

为图片类多模态附件建立 OCR Provider 边界，让图片上传后可以产出可进入 Prompt 的 Markdown 文本。

## 范围

- 在现有 `modules/multimodal` 内新增 OCR provider 能力。
- 默认保留 metadata fallback，避免没有真实 OCR 服务时阻塞本地启动。
- 真实模式使用 OpenAI-compatible vision HTTP provider。
- OCR 结果写入 `MultimodalAttachment.extractedText`。
- 新增 `MultimodalAttachment.metadata` 保存安全元数据。

## 禁止

- Controller 直接调用 OCR HTTP 服务。
- Agent 直接读取图片二进制。
- 将图片 buffer 写入数据库。
- 在日志、metadata、错误中记录图片正文或密钥。
- 本任务不接入 DocumentContent / Chunk / Embedding。

## 配置

- `OCR_PROVIDER=metadata|openai-compatible`
- `OCR_API_URL`
- `OCR_API_KEY`
- `OCR_MODEL`

仅当 `OCR_PROVIDER=openai-compatible` 时强校验 URL / API Key / Model。

## 验收标准

- 图片附件上传后 `extractedText` 为 OCR Markdown 或 metadata fallback。
- `metadata.provider`、`metadata.modality`、`metadata.processedAt` 可用。
- Chat prompt 只能看到提取后的文本，不接触二进制。
- provider 失败时附件状态为 `FAILED`。
