# TASK-065：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Document Versioning，严格遵守 DDD 分层：

```text
Controller
-> Service
-> Repository / Infrastructure
```

## 必须实现

- 新增 `DocumentVersion` Prisma 模型和 migration。
- 回填已有 Document 的 v1。
- 新增版本实体类型。
- `DocumentRepository` 增加 version create/list/find。
- 初始上传 Document 时创建 v1。
- 新增上传新版本 API：
  - `POST /documents/:id/versions/upload`
- 新增版本查询 API：
  - `GET /documents/:id/versions`
  - `GET /documents/:id/versions/:versionId`
- 前端新增版本面板：
  - 展示版本列表
  - 展示 current 版本
  - 支持上传新版本

## 禁止

- Controller 不访问 Prisma。
- Controller 不访问 Storage。
- Service 不直接写 SQL。
- 不做历史版本检索。
- 不做 diff/rollback。
- 不展示完整历史正文。
- React 组件不直接 `fetch`。

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```
