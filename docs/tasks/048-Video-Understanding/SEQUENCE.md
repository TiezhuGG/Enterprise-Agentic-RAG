# TASK-048：流程

## 正常流程

1. 用户上传视频附件。
2. 服务校验 MIME、大小和 conversation 权限。
3. 视频落 MinIO。
4. 创建附件记录。
5. `MultimodalProvider` 将 VIDEO 请求分发给 `VideoUnderstandingProvider`。
6. provider 返回 summary、timeline 和安全 metadata。
7. 附件状态更新为 `EXTRACTED`。

## 失败流程

- provider 失败时附件状态为 `FAILED`。
- Chat 使用失败附件时返回不可用。

## 后续流程

- TASK-049 将 VIDEO 作为 Knowledge Document 进入 ingestion。
