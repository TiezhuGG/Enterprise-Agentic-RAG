# TASK-067：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Document Batch Operations。

## 必须实现

- 先生成 5 个中文任务文档。
- 新增 `apps/backend/src/modules/batch`。
- 新增 API：
  - `POST /documents/batch/archive`
  - `POST /documents/batch/ingest`
  - `PATCH /documents/batch/taxonomy`
- BatchService 只能调用现有 Service：
  - `DocumentService`
  - `IngestionService`
  - `TaxonomyService`
- 前端新增多选和批量操作面板。
- 新增真实 smoke 脚本：
  - `pnpm batch:smoke`
  - 覆盖上传、批量 taxonomy、批量 ingest、pipeline event、批量 archive。

## 禁止

- 不新增批处理数据库表。
- 不实现队列。
- 不让 Controller 访问 Repository。
- 不让 BatchService 访问 Prisma。
- React 组件、app、store 不直接 `fetch`。
- 不绕开现有权限判断。

## 验证

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:deploy
pnpm db:seed
pnpm batch:smoke
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```

## 输出

完成后输出：

- 修改文件列表
- 新增 API
- 前端交互说明
- 真实 smoke 结果
- 自审结论
