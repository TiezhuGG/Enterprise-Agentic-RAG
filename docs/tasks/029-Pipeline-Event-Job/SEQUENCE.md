# TASK-029：流程说明

## 正常 Ingestion 流程

```text
POST /ingestion/documents/:documentId
  ↓
JwtAuthGuard
  ↓
IngestionController
  ↓
IngestionService.ingestDocument()
  ↓
校验 Document 和 Space 写权限
  ↓
PipelineService.startDocumentJob()
  ↓
PipelineJob(RUNNING)
  ↓
validate
  ↓
PipelineEvent(validate, SUCCEEDED)
  ↓
document-processing
  ↓
PipelineEvent(document-processing, SUCCEEDED)
  ↓
chunking
  ↓
PipelineEvent(chunking, SUCCEEDED)
  ↓
embedding
  ↓
PipelineEvent(embedding, SUCCEEDED/SKIPPED)
  ↓
graph-extraction
  ↓
PipelineEvent(graph-extraction, SUCCEEDED/SKIPPED)
  ↓
done
  ↓
PipelineEvent(done, SUCCEEDED)
  ↓
PipelineService.finishJob(SUCCEEDED)
  ↓
PipelineJob(SUCCEEDED)
```

## 失败流程

```text
任意阶段抛出异常
  ↓
IngestionService.runStage() 捕获异常
  ↓
PipelineEvent(stage, FAILED, errorMessage)
  ↓
异常继续抛出
  ↓
IngestionService.catch
  ↓
Document.status = FAILED
  ↓
PipelineService.finishJob(FAILED)
  ↓
PipelineJob(FAILED)
```

失败时必须保留原始业务异常，不因为 Job 收尾失败覆盖原异常。

## 跳过流程

```text
includeEmbedding=false
  ↓
PipelineEvent(embedding, SKIPPED, { reason: "includeEmbedding=false" })

includeGraph=false
  ↓
PipelineEvent(graph-extraction, SKIPPED, { reason: "includeGraph=false" })

Document 已 READY 且 force=false
  ↓
PipelineEvent(validate, SKIPPED, { reason: "already-ready" })
  ↓
PipelineJob(SUCCEEDED)
```

## 查询 Job 列表

```text
GET /documents/:documentId/pipeline/jobs
  ↓
JwtAuthGuard
  ↓
PipelineController
  ↓
RequestContextService.create(user)
  ↓
PipelineService.listDocumentJobs(context, documentId)
  ↓
PipelineRepository.findDocumentPipelineAccess(documentId, userId)
  ↓
校验 Space membership
  ↓
PipelineRepository.listJobsByDocumentId(documentId)
```

## 查询 Job 详情

```text
GET /pipeline/jobs/:jobId
  ↓
JwtAuthGuard
  ↓
PipelineService.getJob(context, jobId)
  ↓
PipelineRepository.findJobById(jobId)
  ↓
PipelineRepository.findDocumentPipelineAccess(job.documentId, userId)
  ↓
返回 Job + Events
```

## 查询 Event 时间线

```text
GET /pipeline/jobs/:jobId/events
  ↓
JwtAuthGuard
  ↓
PipelineService.listJobEvents(context, jobId)
  ↓
权限校验
  ↓
PipelineRepository.listEventsByJobId(jobId)
```

## Metadata 流程

```text
Stage result metadata
  ↓
PipelineService
  ↓
sanitize metadata
  ↓
PipelineRepository
  ↓
JSONB
```

metadata 只保存结构化统计信息，不保存正文、prompt、answer 或二进制内容。

## 与 Observability 的关系

```text
Observability = 实时日志 / counters / metrics
Pipeline Job/Event = 数据库持久化执行历史
```

二者并存，不互相替代。
