# TASK-055：Review Checklist

## 实现前

- [x] 阅读 RetrievalService。
- [x] 阅读 KeywordRetriever / VectorRetriever。
- [x] 阅读 AccessPolicyService。
- [x] 阅读 RequestContextService。

## 实现后

- [x] 新增 5 个任务文档。
- [x] 新增 `modules/search`。
- [x] 新增 `GET /search/fulltext`。
- [x] 新增 `GET /search/semantic`。
- [x] 新增 `GET /search/hybrid`。
- [x] Controller 不访问 Prisma / ES / pgvector / Provider。
- [x] SearchService 复用 RetrievalService。
- [x] 返回 document source 信息。
- [x] 支持 q / spaceId / documentType / limit / offset / sort。
- [x] 权限过滤继续生效。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`

## Smoke

- [ ] 登录后调用 `/search/fulltext?q=报销`。
- [ ] 登录后调用 `/search/semantic?q=报销审批`。
- [ ] 登录后调用 `/search/hybrid?q=单笔超过10000元的报销需要谁审批`。
- [ ] 无权限 Space 不返回结果。
