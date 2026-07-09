# TASK-047：架构决策

## 决策

ASR 使用 provider 接口和 HTTP adapter，不引入本地 Whisper。

## 原因

- 本地 Whisper 依赖模型文件、GPU/CPU 资源和部署环境，超出当前 MVP 闭环。
- provider 接口可兼容 OpenAI-compatible 服务、本地推理网关或云 ASR。

## 后果

- 本地无 ASR 服务时仍能使用 metadata fallback。
- TASK-049 可以复用 ASR provider 做 AUDIO 文档解析。
