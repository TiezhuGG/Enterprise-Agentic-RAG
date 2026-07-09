# TASK-047：流程

## 正常流程

1. 用户上传音频附件。
2. `MultimodalService` 校验 MIME、大小和 conversation 权限。
3. 音频落 MinIO。
4. 创建附件记录。
5. `MultimodalProvider` 将 AUDIO 请求分发到 `AsrProvider`。
6. ASR provider 返回 transcript Markdown 和 metadata。
7. Repository 更新附件为 `EXTRACTED`。

## 失败流程

- provider 失败时附件标记为 `FAILED`。
- 未提取完成的附件不能进入 Chat prompt。

## 异步预留

当前仍同步处理；后续可由 Pipeline Job 或队列承接长音频。
