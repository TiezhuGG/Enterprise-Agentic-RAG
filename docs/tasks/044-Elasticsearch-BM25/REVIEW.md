# TASK-044：Review Checklist

## 实现前

- [ ] 已确认当前 keyword retrieval 入口是 `KeywordRetriever`。
- [ ] 已确认 PostgreSQL FTS fallback 保留在 `ChunkRepository`。
- [ ] 已确认本任务不改 Vector / Reranker / Agent 编排。
- [ ] 已确认不引入 Elasticsearch 管理 UI。

## 文档

- [ ] 已新增 `SPEC.md`。
- [ ] 已新增 `SEQUENCE.md`。
- [ ] 已新增 `ADR.md`。
- [ ] 已新增 `REVIEW.md`。
- [ ] 已新增 `CODEX.md`。

## 配置与 Docker

- [ ] `.env.example` 增加 Elasticsearch 配置。
- [ ] `env.schema.ts` 校验 Elasticsearch 配置。
- [ ] `ConfigService` 提供 `getSearchConfig()`。
- [ ] dev docker compose 增加 Elasticsearch。
- [ ] prod docker compose 增加 Elasticsearch。
- [ ] backend prod env 注入 Elasticsearch 配置。

## Search Infrastructure

- [ ] 新增 `infrastructure/search`。
- [ ] `SearchClient` 是唯一 HTTP 调用 Elasticsearch 的地方。
- [ ] `SearchService` 提供 ensure/index/delete/search/reindex/health 能力。
- [ ] Search 类型不泄漏 Elasticsearch DSL 到业务模块。

## Chunk / Retrieval

- [ ] `ChunkService.processChunks()` 创建 chunk 后同步 ES。
- [ ] `KeywordRetriever` 主路径调用 `SearchService`。
- [ ] `KeywordRetriever` fallback 调用 `ChunkRepository.searchByKeyword()`。
- [ ] 查询带 `spaceIds` filter。
- [ ] 权限最终仍由 Retrieval / AccessPolicy 层处理。

## 脚本

- [ ] 新增 `search:reindex` 脚本。
- [ ] reindex script 只调用 `SearchService`。
- [ ] reindex 输出 JSON summary。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm db:deploy`
- [ ] Elasticsearch 可用时 reindex 成功。
- [ ] Elasticsearch 不可用且 fallback=true 时 keyword retrieval 不崩溃。

## 风险

- [ ] 不要在 Controller 中访问 Elasticsearch。
- [ ] 不要把完整文档正文写入日志。
- [ ] 不要删除 PostgreSQL FTS fallback。
- [ ] 不要让 ES 不可用影响 `/health` liveness。
