# TASK-068：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Ops Console Productization。

## 必须实现

- 先生成 5 个中文任务文档。
- 新增 `apps/backend/src/modules/ops`。
- 新增 `GET /ops/summary`。
- 后端聚合：
  - readiness
  - document status counts
  - recent pipeline jobs
  - pipeline status counts
  - recent execution runs
  - execution status counts
  - smoke commands
- 新增 `pnpm ops:smoke`。
- 前端新增：
  - `services/ops.service.ts`
  - `store/ops.store.ts`
  - `types/ops.ts`
  - `components/ops/*`
- Observability tab 集成 Ops Console。

## 禁止

- 不新增数据库表。
- 不引入外部 APM。
- 不从浏览器执行 shell 命令。
- 不暴露 secret / prompt / answer / document content。
- Controller 不访问 Repository / Prisma。
- 前端组件、app、store 不直接 `fetch`。

## 验证

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm ops:smoke
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```

## 输出

完成后输出：

- 修改文件列表
- API 说明
- 前端 Ops Console 说明
- 真实 smoke 结果
- 自审结论
