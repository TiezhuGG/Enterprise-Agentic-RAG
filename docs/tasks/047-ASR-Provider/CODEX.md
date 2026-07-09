# TASK-047：Codex Prompt

请实现音频 ASR provider。保持现有多模态模块边界，音频仍先落 MinIO，provider 只输出 transcript 文本和安全 metadata。不要引入本地 Whisper 或 ffmpeg 依赖。
