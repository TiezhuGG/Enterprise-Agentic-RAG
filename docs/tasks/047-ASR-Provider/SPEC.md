# TASK-047：Whisper / ASR Provider

## 目标

为音频类多模态附件建立 ASR Provider 边界，让音频上传后可以产出 transcript Markdown。

## 范围

- 新增 `AsrProvider` 接口。
- 默认 metadata fallback。
- 真实模式使用 OpenAI-compatible audio transcription HTTP provider。
- 结果写入 `MultimodalAttachment.extractedText` 和 `metadata`。

## 禁止

- 引入本地 Whisper 原生依赖。
- Controller 直接调用 ASR HTTP。
- Agent 直接处理音频二进制。
- 保存完整音频内容到 DB。
- 本任务不接入 Chunk / Embedding。

## 配置

- `ASR_PROVIDER=metadata|openai-compatible`
- `ASR_API_URL`
- `ASR_API_KEY`
- `ASR_MODEL`

## 验收标准

- 音频附件上传后可得到 transcript 或 fallback 文本。
- metadata 包含 provider、modality、language、duration 预留字段。
- Chat prompt 只使用 transcript 文本。
