# TASK-063：Review Checklist

## 实现前

- [x] 阅读 KnowledgeSpace schema。
- [x] 阅读 KnowledgeSpace entity。
- [x] 阅读 KnowledgeSpace DTO。
- [x] 阅读 KnowledgeSpace Repository/Service。
- [x] 阅读前端 SpaceSwitcher 和 workbench store。

## 实现后

- [x] Prisma 新增 `KnowledgeSpaceType`。
- [x] KnowledgeSpace 新增 `type` 和 `metadata`。
- [x] 新增 migration。
- [x] 后端 entity 支持 normalized metadata。
- [x] DTO 支持 type/metadata。
- [x] Repository create/update/list 返回 type/metadata。
- [x] 前端类型支持 type/metadata。
- [x] 前端 service/store 支持创建和更新 profile。
- [x] 前端新增或扩展 Space Profile UI。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm db:validate`
- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

说明：`pnpm build` 使用 Windows 稳定环境变量执行：`NEXT_TELEMETRY_DISABLED=1`、`NODE_OPTIONS=--max-old-space-size=4096`。

## Smoke

- [ ] 创建 DEPARTMENT Space。
- [ ] 创建 PROJECT Space。
- [ ] 创建 CUSTOMER Space。
- [ ] 更新 Space profile。
- [ ] Space 列表展示类型。
- [ ] 现有文档上传/ingest 不受影响。

说明：Smoke 需要执行 migration 并启动前后端后手工验证。
