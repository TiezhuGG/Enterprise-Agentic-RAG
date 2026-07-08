# TASK-026 Review Checklist

## 实现前必须确认

- [ ] 已阅读 `SPEC.md`。
- [ ] 已阅读 `SEQUENCE.md`。
- [ ] 已阅读 `ADR.md`。
- [ ] 已阅读 `REVIEW.md`。
- [ ] 已阅读 `CODEX.md`。
- [ ] 确认当前任务只做 MVP 闭环编排，不扩展 OCR / ASR / TTS / 视频理解。
- [ ] 确认不引入 Elasticsearch、pgvector、队列系统或 Kubernetes。
- [ ] 确认不修改现有目录结构约定，只新增 `modules/ingestion` 和 `docs/demo`。

## 架构检查

- [ ] Controller 只接收请求、校验 DTO、调用 Service。
- [ ] Controller 不访问 Prisma。
- [ ] Controller 不访问 Redis。
- [ ] Controller 不访问 MinIO。
- [ ] Controller 不访问 Neo4j。
- [ ] Controller 不调用模型 Provider。
- [ ] IngestionService 不直接访问 Prisma。
- [ ] IngestionService 不直接访问 MinIO SDK。
- [ ] IngestionService 不直接访问 Neo4j SDK。
- [ ] IngestionService 不直接调用 HTTP 模型接口。
- [ ] Repository 是唯一允许访问 Prisma 的新增代码位置。
- [ ] Existing Service 通过依赖注入复用，不重新实现 parser/chunk/embedding/graph 逻辑。

## 权限检查

- [ ] `POST /documents/:id/ingest` 要求当前用户属于文档所在 Space。
- [ ] 允许 `OWNER`。
- [ ] 允许 `EDITOR`。
- [ ] 拒绝 `VIEWER`。
- [ ] 拒绝非 Space 成员。
- [ ] `POST /spaces/:spaceId/ingest` 同样执行 Space 权限判断。
- [ ] 不能通过 documentId 跨 Space 入库。

## 入库流程检查

- [ ] validate stage 存在。
- [ ] document-processing stage 存在。
- [ ] chunking stage 存在。
- [ ] embedding stage 存在。
- [ ] graph-extraction stage 存在。
- [ ] done stage 存在。
- [ ] 成功时 Document 最终状态为 `READY`。
- [ ] 失败时 Document 最终状态为 `FAILED`。
- [ ] `force=false` 时避免重复处理已经 READY 的文档。
- [ ] `force=true` 时可以重新生成 content/chunk/embedding/graph。
- [ ] `includeGraph=false` 时 graph stage 标记为 skipped。
- [ ] 不支持 IMAGE/AUDIO/VIDEO 进入 document parser pipeline。

## 状态接口检查

- [ ] `GET /documents/:id/ingest/status` 返回 Document 状态。
- [ ] 返回 content 是否存在。
- [ ] 返回 chunk 数量。
- [ ] 返回 embedding 数量。
- [ ] 返回 readyForRetrieval。
- [ ] 不泄露文档全文。
- [ ] 不泄露 prompt 或 answer。

## Observability 检查

- [ ] 入库开始记录 requestId / executionId。
- [ ] 每个 stage 记录 durationMs。
- [ ] 成功计数记录。
- [ ] 失败计数记录。
- [ ] 日志不包含完整 document content。
- [ ] 日志不包含 API Key。
- [ ] `/metrics` 能体现 ingestion 成功/失败和耗时。

## Demo 文档检查

- [ ] 新增 `docs/demo/DEMO_SCRIPT.md`。
- [ ] 新增 `docs/demo/PROVIDER_SMOKE.md`。
- [ ] 新增 `docs/demo/sample-policy.md`。
- [ ] Demo Script 包含本地启动步骤。
- [ ] Demo Script 包含上传文档步骤。
- [ ] Demo Script 包含调用 ingest 步骤。
- [ ] Demo Script 包含调用 Agent Stream 步骤。
- [ ] Demo Script 包含查看 citations / trace / metrics 步骤。

## 真实服务 Smoke 检查

- [ ] Smoke 使用真实 `.env` 配置。
- [ ] LLM 不可用时失败。
- [ ] Embedding 不可用时失败。
- [ ] Reranker 不可用时失败。
- [ ] MinIO 不可用时失败。
- [ ] Redis 不可用时失败。
- [ ] Neo4j 不可用且 includeGraph=true 时失败。
- [ ] Smoke 输出隐藏 API Key。

## 验证命令

实现后必须执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

推荐额外执行：

```text
pnpm db:validate
pnpm demo:smoke
pnpm demo:ingest
```

## 最终输出要求

完成编码和自查后输出：

- 修改文件列表。
- 新增目录。
- API 说明。
- 入库链路说明。
- Demo 使用方式。
- 真实服务 Smoke 结果。
- format / lint / typecheck / build 结果。
- 已知限制。
- 后续建议。
