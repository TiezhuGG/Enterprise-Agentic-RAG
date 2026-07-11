# TASK-067：Review Checklist

## 实现前

- [x] 阅读 IngestionService，确认批量 ingest 可复用现有文档处理流水线。
- [x] 阅读 DocumentService，确认批量归档复用现有权限和软删除逻辑。
- [x] 阅读 TaxonomyService，确认批量分类/标签更新复用既有校验。
- [x] 阅读 Workbench store，确认前端批量状态可放在现有工作台状态中。
- [x] 阅读 DocumentListPanel，确认可在现有列表上增加多选交互。

## 实现后

- [x] 新增 Batch module。
- [x] 新增 batch DTO 和类型。
- [x] Controller 暴露批量 API。
- [x] BatchService 复用现有 Service，不访问 Repository / Prisma。
- [x] 前端新增 batch.service。
- [x] Workbench store 支持 selectedDocumentIds 和 batchState。
- [x] DocumentListPanel 支持多选。
- [x] 新增 BatchOperationsPanel。
- [x] 组件、app、store 不直接 `fetch`。
- [x] 新增 `batch:smoke`，用于真实服务链路验证。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `pnpm db:validate`
- [x] `pnpm db:deploy`
- [x] `pnpm db:seed`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

## 真实 Smoke

- [x] `pnpm --filter @enterprise-agentic-rag/backend batch:smoke`
- [x] 创建临时 Knowledge Space 成功。
- [x] 上传 Markdown / TXT 文档到 MinIO 成功。
- [x] 批量 taxonomy 成功：2/2。
- [x] 批量 ingest 成功：2/2。
- [x] 文档处理生成 DocumentContent / Chunk 成功。
- [x] Pipeline events 包含 `validate / document-processing / chunking / embedding(SKIPPED) / graph-extraction(SKIPPED) / done`。
- [x] 批量 archive 成功：2/2。
- [x] 单个操作结果按文档维度返回，失败不会中断后续文档。

## Smoke 结果摘要

- Space：`cmrgangpy00004oirp9z8q4fb`
- Documents：
  - `cmrgangqm00014oir8ncouwes`
  - `cmrgangqn00024oir7wkjmih0`
- Chunk 数：
  - `cmrgangqm00014oir8ncouwes`: 2
  - `cmrgangqn00024oir7wkjmih0`: 1
- Pipeline Jobs：
  - `cmrganguj00084oirsewdnepc`
  - `cmrganicx000i4oird2h37tvj`

## 自审结论

- BatchController 只做请求入口和 ExecutionContext 获取，不访问数据库、Repository 或基础设施。
- BatchService 只编排现有 Document / Ingestion / Taxonomy Service，未复制业务规则。
- 前端仍保持 `Component -> Store -> Service -> API`，没有在组件或 store 中直接请求网络。
- 批量操作采用逐文档执行与逐项结果返回，适合 MVP 阶段的可解释失败处理。
