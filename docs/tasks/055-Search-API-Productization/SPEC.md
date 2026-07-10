# TASK-055：Search API Productization

## 目标

把搜索从 Agent 调试能力中拆出来，成为可被产品页面、CLI、第三方系统独立调用的 Search API。

新增 API：

```text
GET /search/fulltext
GET /search/semantic
GET /search/hybrid
```

## 查询参数

```text
q
spaceId?
documentType?
limit?
offset?
sort?
```

## 返回

每条结果必须包含：

- chunkId
- documentId
- document title
- content snippet
- score
- metadata

响应还应包含：

- mode
- query
- limit / offset / total
- retrieval breakdown

## 架构边界

必须：

```text
SearchController
↓
SearchService
↓
RetrievalService
↓
Retriever / Infrastructure
```

允许 SearchService 读取 DocumentRepository 进行来源文档信息补全。

禁止：

- Controller 访问 Prisma。
- Controller 访问 Elasticsearch。
- Controller 访问 pgvector。
- Controller 访问 Provider。
- Search API 绕过 ExecutionContext / AccessPolicy。

## 权限

- 必须使用 JWT。
- 必须通过 RequestContextService 构建 ExecutionContext。
- tenant、space、securityLevel、department 过滤继续复用 RetrievalService / AccessPolicy。
- `spaceId` 只作为请求过滤条件，不能扩大用户权限。

## 验收标准

- 全文检索可独立调用。
- 语义检索可独立调用。
- 混合检索可独立调用。
- tenant / space / securityLevel 过滤有效。
- API 不依赖 `/agent/chat/stream`。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
