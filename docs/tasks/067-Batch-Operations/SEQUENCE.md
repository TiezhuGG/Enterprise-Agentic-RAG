# TASK-067：Sequence

## 批量 Ingest

```text
User
-> POST /documents/batch/ingest
-> BatchController
-> BatchService
-> for each documentId:
   -> IngestionService.ingestDocument()
   -> record success/failure
-> return summary
```

失败策略：

- 单个文档失败只记录该项 failure。
- 继续处理后续文档。
- 最终返回 `succeeded / failed / results`。

## 批量 Archive

```text
User
-> POST /documents/batch/archive
-> BatchController
-> BatchService
-> for each documentId:
   -> DocumentService.delete()
   -> record success/failure
-> return summary
```

权限：

- 由 `DocumentService.delete()` 判断 OWNER。

## 批量 Taxonomy

```text
User
-> PATCH /documents/batch/taxonomy
-> BatchController
-> BatchService
-> for each documentId:
   -> TaxonomyService.updateDocumentTaxonomy()
   -> record success/failure
-> return summary
```

权限：

- 由 `TaxonomyService.updateDocumentTaxonomy()` 判断 OWNER / EDITOR。

## 前端流程

```text
DocumentListPanel 多选
-> BatchOperationsPanel 显示已选数量
-> 用户选择批量操作
-> workbench.store action
-> batch.service
-> API
-> 刷新 documents / pipeline / taxonomy
```

## 真实 Smoke 流程

```text
pnpm batch:smoke
-> create Nest application context
-> find seed admin user
-> create temporary Knowledge Space
-> upload Markdown + TXT documents through UploadService
-> create Category + Tags through TaxonomyService
-> BatchService.updateTaxonomy()
-> BatchService.ingestDocuments(includeEmbedding=false, includeGraph=false)
-> verify Pipeline events
-> BatchService.archiveDocuments()
-> print JSON summary
```

说明：

- Smoke 关闭 embedding / graph，是为了验证 TASK-067 本身的批量编排能力，不依赖外部模型可用性。
- Ingest 仍会真实访问 MinIO、Postgres、Document Processing、Chunk、Search index 和 Pipeline。
