# TASK-055：Codex Prompt

你是 Enterprise Agentic RAG 项目的后端工程师。

请实现 Search API Productization。

## 必须遵守

- 先读本任务 5 个文档。
- 严格遵守 DDD 边界。
- Controller 不访问 Prisma / Elasticsearch / pgvector / Provider。
- Search API 必须复用 RetrievalService / AccessPolicy。
- 不返回完整 DocumentContent。

## 实现目标

新增：

```text
apps/backend/src/modules/search/
```

API：

```text
GET /search/fulltext
GET /search/semantic
GET /search/hybrid
```

查询参数：

```text
q
spaceId?
documentType?
limit?
offset?
sort?
```

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
