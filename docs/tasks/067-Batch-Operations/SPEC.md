# TASK-067：Batch Operations

## 目标

为 Demo Workbench 增加文档批量操作能力，让用户可以多选文档后执行常见管理动作。

第一版覆盖：

```text
批量 Ingest
批量 Archive
批量设置 Category / Tags
```

## 禁止项

- 不新增批处理数据库表。
- 不实现后台异步队列。
- 不实现批量上传。
- 不实现批量版本回滚。
- 不绕开现有 Document / Ingestion / Taxonomy Service。
- Controller 不访问 Repository、Prisma、Storage、Vector、Search。
- 前端组件不直接 `fetch`。

## 后端结构

新增：

```text
apps/backend/src/modules/batch/
├── batch.module.ts
├── batch.controller.ts
├── batch.service.ts
├── batch.types.ts
├── run-batch-smoke.ts
├── dto/
│   ├── batch-document-ids.dto.ts
│   ├── batch-ingest.dto.ts
│   └── batch-taxonomy.dto.ts
└── index.ts
```

## API

```text
POST /documents/batch/archive
POST /documents/batch/ingest
PATCH /documents/batch/taxonomy
```

请求限制：

- `documentIds` 必须非空。
- 最多 100 个 `documentId`。
- 服务端自动去重。

## 返回类型

```ts
interface BatchOperationResponse<T> {
  operation: 'archive' | 'ingest' | 'taxonomy';
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    documentId: string;
    status: 'success' | 'failed';
    data?: T;
    errorMessage?: string;
  }>;
}
```

## 权限

批量模块不单独实现权限系统，而是逐项复用现有 Service：

- Archive：复用 `DocumentService.delete()`，即 OWNER。
- Ingest：复用 `IngestionService.ingestDocument()`，即 OWNER / EDITOR。
- Taxonomy：复用 `TaxonomyService.updateDocumentTaxonomy()`，即 OWNER / EDITOR。

## 前端结构

新增：

```text
apps/frontend/services/batch.service.ts
apps/frontend/components/workbench/BatchOperationsPanel.tsx
```

Workbench store 新增：

- `selectedDocumentIds`
- `batchState`
- `toggleDocumentSelection`
- `clearDocumentSelection`
- `batchArchiveDocuments`
- `batchIngestDocuments`
- `batchUpdateTaxonomy`

## 验收标准

- 多选文档后可批量 ingest。
- 多选文档后可批量 archive。
- 多选文档后可批量设置 category/tags。
- 单个文档失败不影响其他文档继续处理。
- 批量结果展示成功/失败数量。
- 前端组件、app、store 不直接 `fetch`。
- 真实 smoke 可验证上传、批量 taxonomy、批量 ingest、pipeline event、批量 archive。
