# TASK-030：流程说明

## 初始化流程

```text
HomePage
  ↓
DemoWorkbench
  ↓
workbench.store.initialize()
  ↓
读取 localStorage JWT token
  ↓
KnowledgeSpaceService.list()
  ↓
选择第一个 Space
  ↓
DocumentService.listBySpace(spaceId)
```

如果没有 Space，页面显示空状态和创建入口。

## Token 流程

```text
AuthTokenPanel
  ↓
workbench.store.setAuthToken(token)
  ↓
api-client.setAuthToken(token)
  ↓
刷新 Space 列表
```

Token 存储复用现有 `api-client.ts`。

## Space 创建流程

```text
SpaceSwitcher 输入名称
  ↓
workbench.store.createSpace(name)
  ↓
KnowledgeSpaceService.create()
  ↓
selectedSpaceId = newSpace.id
  ↓
DocumentService.listBySpace(newSpace.id)
```

## Document 上传流程

```text
DocumentUploadPanel 选择文件
  ↓
workbench.store.uploadDocument(file)
  ↓
UploadService.uploadDocument(spaceId, file)
  ↓
Document created
  ↓
刷新 Document 列表
  ↓
selectedDocumentId = document.id
  ↓
加载 metadata / pipeline jobs
```

上传失败时保留当前 Space 和 Document 状态，只展示错误。

## Document 选择流程

```text
DocumentListPanel 点击 Document
  ↓
workbench.store.selectDocument(documentId)
  ↓
DocumentService.getMetadata(documentId)
  ↓
PipelineService.listDocumentJobs(documentId)
  ↓
如果存在最新 Job，则加载 events
```

metadata API 如果返回 404，说明文档尚未 processing 完成，面板显示“尚未生成”。

## Ingestion 流程

```text
IngestionPanel 点击 Ingest
  ↓
workbench.store.ingestSelectedDocument()
  ↓
IngestionService.ingestDocument(documentId, {
  force: true,
  includeEmbedding: true,
  includeGraph: false
})
  ↓
刷新 Document 列表
  ↓
加载 pipelineJobId events
  ↓
加载 Document metadata
```

失败时：

```text
Ingestion API error
  ↓
显示 error
  ↓
尝试刷新 Pipeline jobs/events
```

## Pipeline Timeline 流程

```text
PipelineTimeline
  ↓
读取 store.pipelineEvents
  ↓
按 createdAt 排序显示：
  - stage
  - status
  - durationMs
  - errorMessage
  - metadata
```

metadata 渲染前只展示结构化字段，不展示正文内容。

## Assistant 流程

```text
DemoWorkbench tab = Assistant
  ↓
ChatWindow
```

TASK-030 不改 Agent Chat 的核心交互。
