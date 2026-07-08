# TASK-029：Review Checklist

## 实现前检查

- [ ] 已阅读 `SPEC.md`、`SEQUENCE.md`、`ADR.md`。
- [ ] 确认本任务只做 Document Pipeline Job/Event。
- [ ] 确认不引入队列。
- [ ] 确认不实现 retry / cancel。
- [ ] 确认不实现前端页面。
- [ ] 确认不记录正文、prompt、answer、buffer、API key。

## Prisma 检查

- [ ] 新增 `PipelineJobStatus` enum。
- [ ] 新增 `PipelineEventStatus` enum。
- [ ] 新增 `PipelineJob` model。
- [ ] 新增 `PipelineEvent` model。
- [ ] `Document` / `KnowledgeSpace` relation 正确。
- [ ] 新增 migration。
- [ ] `pnpm db:validate` 通过。

## Pipeline 模块检查

- [ ] 新增 `pipeline.module.ts`。
- [ ] 新增 `pipeline.controller.ts`。
- [ ] 新增 `pipeline.service.ts`。
- [ ] 新增 `pipeline.repository.ts`。
- [ ] 新增 `pipeline.types.ts`。
- [ ] 新增 `index.ts`。
- [ ] Controller 不访问 Repository / Prisma。
- [ ] Service 不访问 Prisma。

## Ingestion 集成检查

- [ ] Ingestion 开始后创建 `PipelineJob(RUNNING)`。
- [ ] `validate` 成功写入 event。
- [ ] `document-processing` 成功写入 event。
- [ ] `chunking` 成功写入 event。
- [ ] `embedding` 成功或跳过写入 event。
- [ ] `graph-extraction` 成功或跳过写入 event。
- [ ] `done` 成功写入 event。
- [ ] 任意阶段失败写入 failed event。
- [ ] 成功收尾 Job 为 `SUCCEEDED`。
- [ ] 失败收尾 Job 为 `FAILED`。
- [ ] `IngestionResult.pipelineJobId` 返回。

## API 检查

- [ ] `GET /documents/:documentId/pipeline/jobs` 可用。
- [ ] `GET /pipeline/jobs/:jobId` 可用。
- [ ] `GET /pipeline/jobs/:jobId/events` 可用。
- [ ] 用户只能访问自己 Space 内文档的 Pipeline。
- [ ] 返回 metadata 不包含正文。

## 验证命令

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed`

## 可选 Smoke

- [ ] `pnpm demo:ingest <documentId> <userId> <spaceId> --force --no-graph`
- [ ] 查询 `GET /documents/:documentId/pipeline/jobs`
- [ ] 查询 `GET /pipeline/jobs/:jobId/events`

## 实现后结论

- [ ] Pipeline Job/Event 已形成持久化执行时间线。
- [ ] 不破坏现有 Ingestion / Retrieval / Agent。
- [ ] 后续前端工作台可直接消费 Pipeline API。
