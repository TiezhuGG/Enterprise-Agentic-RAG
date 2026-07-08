# TASK-042：Review Checklist

## 实现前

- [ ] 确认 DocumentContent.metadata 已包含 `securityLevel`。
- [ ] 确认 Chunk.metadata 已传播 `securityLevel`。
- [ ] 确认 Retrieval raw results 在 Reranker 前可过滤。
- [ ] 确认 GraphTool 当前需要安全入口。

## 实现中

- [ ] 新增 `modules/access-policy`。
- [ ] 实现 subject/resource/decision 类型。
- [ ] 实现 PUBLIC / INTERNAL / CONFIDENTIAL 规则。
- [ ] 实现 department metadata 规则。
- [ ] seed 新增 `knowledge.confidential.read` 并授予 admin。
- [ ] DocumentService 读路径接入 policy。
- [ ] RetrievalService 在 RRF/Reranker 前接入 policy。
- [ ] GraphRetrievalService 新增 `retrieveForContext()`。
- [ ] GraphTool 改为调用安全入口。
- [ ] Chunk metadata 识别和传播 department 字段。

## 安全检查

- [ ] 普通 VIEWER 无法读取 CONFIDENTIAL。
- [ ] admin 可以读取 CONFIDENTIAL。
- [ ] Space OWNER 可以读取 CONFIDENTIAL。
- [ ] department 不匹配时普通用户被拒绝。
- [ ] 被拒绝结果不会进入 Reranker。
- [ ] 被拒绝结果不会进入 citation。
- [ ] PolicyService 不访问 Prisma / Redis / Neo4j。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm db:seed`

## 实现后结论

- [ ] Data Permission Policy 已成为 Document / Retrieval / Graph 的统一权限入口。
- [ ] 没有新增后台 UI 或复杂策略 DSL。
- [ ] 后续 PGVector / Elasticsearch 可复用同一 policy。
