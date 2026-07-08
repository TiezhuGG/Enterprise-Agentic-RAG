# TASK-041：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请严格遵守 DDD 分层和现有目录结构，实现 Tenant-Aware RBAC。

## 必须先阅读

```text
docs/tasks/041-Tenant-Aware-RBAC/SPEC.md
docs/tasks/041-Tenant-Aware-RBAC/SEQUENCE.md
docs/tasks/041-Tenant-Aware-RBAC/ADR.md
docs/tasks/041-Tenant-Aware-RBAC/REVIEW.md
docs/tasks/041-Tenant-Aware-RBAC/CODEX.md
```

## 目标

让 Space / Document / Upload / Pipeline / Retrieval 都基于 ExecutionContext.tenantId 做访问过滤。

## 实现要求

- `KnowledgeSpaceRepository.listForUser()` 必须增加 tenant filter。
- `KnowledgeSpaceRepository.findAccessibleById()` 必须增加 tenant filter。
- 新增方法查询当前用户在当前 tenant 下可访问的 Space IDs。
- `DocumentService`、`UploadService`、`PipelineService` 的 Space role 校验必须传递 `context.tenantId`。
- `IngestionService` 的 Document / Space 访问校验必须传递 `context.tenantId`。
- `RetrievalService` 不允许只信任 `context.spaceIds`，必须重新计算 tenant-scoped allowedSpaceIds。
- `VectorRetriever`、`KeywordRetriever`、`GraphRetriever` 只能接收已经收紧后的 `spaceIds`。
- seed 必须回填 admin legacy spaces 的 tenantId。

## 禁止

- 不新增后台管理 UI。
- 不实现 Data Permission Policy。
- 不实现 PGVector / Elasticsearch。
- 不修改 Agent API wire shape。
- 不让 Controller 访问 Repository / Prisma。
- 不在 Service 中写 raw SQL。
- 不把 `tenantId = null` 当作全租户共享数据。

## 验证

完成后执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:migrate
pnpm db:seed
```

输出：

- 修改文件列表
- Tenant-aware RBAC 设计说明
- Space / Document / Retrieval 权限链路
- Seed 回填策略
- 测试结果
