# TASK-041：Review Checklist

## 实现前

- [ ] 确认 `ExecutionContext` 已包含 `tenantId`。
- [ ] 确认 JWT payload / JwtStrategy 已携带 `tenantId`。
- [ ] 确认 KnowledgeSpace 已有 `tenantId` 字段。
- [ ] 确认 Document、Upload、Pipeline 都通过 Space role 判断。
- [ ] 确认 Retrieval 当前只依赖 `context.spaceIds`。

## 实现中

- [ ] `KnowledgeSpaceRepository.listForUser()` 增加 tenant filter。
- [ ] `KnowledgeSpaceRepository.findAccessibleById()` 增加 tenant filter。
- [ ] 新增 tenant-scoped accessible spaceIds 查询。
- [ ] `KnowledgeSpaceService` 所有访问入口传递 `context.tenantId`。
- [ ] `DocumentService` Space role check 传递 `context.tenantId`。
- [ ] `UploadService` Space role check 传递 `context.tenantId`。
- [ ] `PipelineService` Space role check 传递 `context.tenantId`。
- [ ] `IngestionService` Document/Space access check 传递 `context.tenantId`。
- [ ] `RetrievalService` 检索前重新计算 allowedSpaceIds。
- [ ] `RetrievalModule` 正确导入 KnowledgeSpaceModule。
- [ ] seed 回填 admin legacy spaces tenantId。

## 安全检查

- [ ] 有 tenant 用户不能访问 tenantId=null Space。
- [ ] 有 tenant 用户不能访问其他 tenant Space。
- [ ] 无 tenant 用户不能访问有 tenant Space。
- [ ] Retrieval 不信任调用方传入的 `spaceIds`。
- [ ] Graph Retrieval 保留 spaceId filter。
- [ ] 错误信息不暴露其他 tenant 的资源存在性。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed`

## 实现后结论

- [ ] Tenant-aware RBAC 已覆盖 Space / Document / Upload / Pipeline / Retrieval。
- [ ] Demo Workbench 登录 admin 后仍能看到默认 tenant 的数据。
- [ ] 未引入 Data Permission Policy、PGVector、Elasticsearch 或 UI 管理页面。
