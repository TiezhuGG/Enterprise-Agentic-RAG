# TASK-048：Video Understanding

## 目标

扩展多模态附件支持 VIDEO，并通过 provider 输出视频摘要、时间线片段和可进入 prompt 的文本。

## 范围

- `MultimodalAttachmentType` 增加 `VIDEO`。
- 新增 `VideoUnderstandingProvider`。
- 默认 metadata fallback。
- 真实模式使用 OpenAI-compatible / HTTP provider。
- 视频文件仍只存 MinIO。

## 禁止

- Agent 直接读取视频二进制。
- 在后端本地抽帧或运行 ffmpeg。
- 将视频内容写入 DB。
- 本任务不接入 DocumentContent / Chunk / Embedding。

## 配置

- `VIDEO_PROVIDER=metadata|openai-compatible`
- `VIDEO_API_URL`
- `VIDEO_API_KEY`
- `VIDEO_MODEL`

## 验收标准

- 视频附件上传成功。
- `extractedText` 包含摘要和 timeline Markdown。
- metadata 记录 modality、provider、processedAt、timelineCount。
