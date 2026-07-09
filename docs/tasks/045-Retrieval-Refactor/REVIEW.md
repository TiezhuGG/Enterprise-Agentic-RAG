# TASK-045：Review Checklist

## 实现前

- [ ] 已确认 vector retriever 通过 PGVector。
- [ ] 已确认 keyword retriever 通过 Elasticsearch，且有 PostgreSQL FTS fallback。
- [ ] 已确认 graph retriever 通过 KnowledgeGraphService。
- [ ] 已确认 AccessPolicyService 是最终权限过滤入口。
- [ ] 已确认 TASK-044 未提交改动不能回退。

## 文档

- [ ] 新增 `SPEC.md`。
- [ ] 新增 `SEQUENCE.md`。
- [ ] 新增 `ADR.md`。
- [ ] 新增 `REVIEW.md`。
- [ ] 新增 `CODEX.md`。

## Backend Retrieval

- [ ] 新增 Retrieval pipeline breakdown 类型。
- [ ] 新增 `retrieveWithBreakdown()`。
- [ ] `retrieve()` 保持兼容。
- [ ] vector stage 有独立 count / duration。
- [ ] keyword stage 有独立 count / duration。
- [ ] graph stage 有独立 count / duration / skipped reason。
- [ ] permission-filter stage 有 input / output count。
- [ ] RRF stage 有 input / output count。
- [ ] reranker stage 有 input / output count。
- [ ] context-builder stage 有 input / output count。
- [ ] Retrieval failure 仍记录 observability。

## Agent Trace

- [ ] `AgentState` 保存 retrieval breakdown。
- [ ] Retrieval node 使用 breakdown 接口。
- [ ] Execution trace metadata 包含 retrieval breakdown counts。
- [ ] ExecutionService metadata allowlist 不包含敏感正文。

## Evaluation

- [ ] Evaluation case result 包含 retrieval breakdown。
- [ ] Markdown report 输出短 breakdown。
- [ ] 新增 hybrid retrieval dataset example。
- [ ] Evaluation 仍只调用 Service。

## Frontend

- [ ] Observability timeline 能识别 retrieval event。
- [ ] Timeline 展示 retrieval breakdown。
- [ ] 前端不展示 query / chunk content。
- [ ] 组件不直接 fetch。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm db:deploy`
- [ ] Agent streaming API 不破。
- [ ] Evaluation run 不破。

## 风险

- [ ] 不要改变 RRF 公式。
- [ ] 不要绕过 AccessPolicyService。
- [ ] 不要把 query 放入 execution trace metadata。
- [ ] 不要让前端展示完整知识正文。
