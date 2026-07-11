# TASK-066：Review Checklist

## 实现前

- [x] 阅读 Document 模型。
- [x] 阅读 Search API。
- [x] 阅读 Workbench store。
- [x] 阅读 Search Center。

## 实现后

- [x] Prisma 新增 Category/Tag/Assignment。
- [x] Migration 创建表和索引。
- [x] 新增 Taxonomy module。
- [x] TaxonomyRepository 不泄露 Prisma。
- [x] TaxonomyService 复用 Space role + AccessPolicy。
- [x] Controller 暴露 category/tag/document taxonomy API。
- [x] Search 支持 categoryId/tagId 后过滤。
- [x] 前端 service/store/types 接入 taxonomy。
- [x] 新增 DocumentTaxonomyPanel。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `pnpm db:validate`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

## Smoke

- [ ] 创建分类成功。
- [ ] 创建标签成功。
- [ ] 文档设置分类和标签成功。
- [ ] VIEWER 不能修改分类标签。
- [ ] Search 按分类过滤生效。
- [ ] Search 按标签过滤生效。

> 说明：本轮完成代码级验证；Smoke 需要启动后端、前端并迁移数据库后执行。
