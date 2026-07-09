# TASK-048：架构决策

## 决策

视频理解第一版采用 provider 输出，不在应用内实现抽帧、ASR、关键帧描述。

## 原因

- 视频处理依赖 ffmpeg、模型和长任务调度，不适合直接塞入当前同步附件上传流程。
- provider 可以由本地推理网关或云服务实现，应用保持稳定边界。

## 后果

- 本地 demo 仍可使用 fallback。
- 后续可以把视频理解切到异步 pipeline，不影响 Chat 和 Document Processing 的调用方。
