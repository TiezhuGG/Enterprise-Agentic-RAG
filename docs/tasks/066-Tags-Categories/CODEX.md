# TASK-066：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Tags & Categories，严格遵守 DDD 边界。

## 必须实现

- 新增 5 个任务文档。
- 新增 Prisma 模型：
  - `DocumentCategory`
  - `DocumentTag`
  - `DocumentTagAssignment`
- 新增 `modules/taxonomy`：
  - `taxonomy.module.ts`
  - `taxonomy.controller.ts`
  - `taxonomy.service.ts`
  - `taxonomy.repository.ts`
  - `taxonomy.types.ts`
  - `dto/`
  - `entities/`
- 新增 API：
  - `GET /spaces/:spaceId/categories`
  - `POST /spaces/:spaceId/categories`
  - `PATCH /categories/:id`
  - `DELETE /categories/:id`
  - `GET /spaces/:spaceId/tags`
  - `POST /spaces/:spaceId/tags`
  - `PATCH /tags/:id`
  - `DELETE /tags/:id`
  - `GET /documents/:id/taxonomy`
  - `PATCH /documents/:id/taxonomy`
- 前端新增：
  - `services/taxonomy.service.ts`
  - `DocumentTaxonomyPanel.tsx`
  - Workbench store taxonomy state/actions

## 禁止

- 不实现知识本体。
- 不改 Agent。
- 不改 Chunk/Embedding schema。
- Controller 不访问 Prisma。
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
