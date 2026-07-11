# TASK-065：ADR

## 决策一：Document 保持当前可检索版本

`Document` 继续作为知识库聚合根下的当前文档实体。Chunk、Embedding、Search、Citation 都仍然指向 `Document`，不在本任务中改为 version-aware retrieval。

原因：

- 当前检索链路已经稳定。
- 版本化如果直接横切 Chunk/Embedding/Search，会导致大量返工。
- MVP 阶段更需要用户理解“当前版本可检索，历史版本可回溯”。

后果：

- 历史版本不能单独搜索。
- 后续如需版本级检索，可在 TASK-后续中增加 `documentVersionId` 到 `DocumentContent/Chunk`。

## 决策二：DocumentVersion 保存源文件元数据，不保存历史正文

`DocumentVersion` 保存 storageKey、mimeType、size、hash、status 和安全 metadata，不保存完整解析正文。

原因：

- 避免正文重复存储。
- 避免版本表变成新的内容索引源。
- 保持数据泄露面较小。

## 决策三：上传新版本复用 UploadService

版本上传仍由 UploadService 处理文件校验、对象存储和观测指标。

原因：

- 上传规则已经集中在 UploadService。
- Controller 不需要接触 MinIO 或存储细节。

## 决策四：DocumentRepository 同步 current version 状态

当 `DocumentRepository.update()` 修改 Document status 时，同步当前版本 status。

原因：

- Ingestion 已经通过 DocumentRepository 更新 Document 状态。
- 不需要让每个 Pipeline stage 都理解 DocumentVersion。

风险：

- 如果未来支持并发多版本 ingestion，需要引入 explicit activeVersionId 或 job-version 绑定。
