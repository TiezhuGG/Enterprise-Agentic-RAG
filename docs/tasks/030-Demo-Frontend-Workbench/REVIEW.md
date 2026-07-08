# TASK-030：Review Checklist

## 实现前检查

- [ ] 已阅读 `SPEC.md`、`SEQUENCE.md`、`ADR.md`。
- [ ] 确认 TASK-029 未提交改动不回退。
- [ ] 确认本任务不新增后端领域能力。
- [ ] 确认组件不直接 fetch。
- [ ] 确认不展示正文内容。

## 服务层检查

- [ ] `knowledge-space.service.ts` 已实现。
- [ ] `document.service.ts` 已实现。
- [ ] `upload.service.ts` 已实现 multipart。
- [ ] `ingestion.service.ts` 已实现 ingest/status。
- [ ] `pipeline.service.ts` 已实现 jobs/events。
- [ ] 服务层复用 `api-client.ts`。

## Store 检查

- [ ] 新增 `workbench.store.ts`。
- [ ] 保存 Space、Document、Pipeline、Metadata 状态。
- [ ] 选择 Space 会加载 Documents。
- [ ] 选择 Document 会加载 Metadata 和 Pipeline。
- [ ] 上传成功会刷新并选中文档。
- [ ] Ingestion 成功会刷新文档、metadata、pipeline。
- [ ] 错误状态可展示。

## UI 检查

- [ ] 新增 `DemoWorkbench`。
- [ ] 新增 Token 面板。
- [ ] 新增 Space 切换/创建。
- [ ] 新增 Document 列表。
- [ ] 新增 Upload 面板。
- [ ] 新增 Ingestion 面板。
- [ ] 新增 Pipeline Timeline。
- [ ] 新增 Metadata 面板。
- [ ] 保留 ChatWindow。
- [ ] 移动端不严重溢出。

## 验证命令

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`

## Smoke

- [ ] 输入 JWT token。
- [ ] 创建或选择 Space。
- [ ] 上传文档。
- [ ] 执行 Ingestion。
- [ ] 查看 Pipeline Timeline。
- [ ] 查看 Metadata。
- [ ] 切换 Assistant Chat。

## 实现后结论

- [ ] 前端可以完成 MVP 文档管线演示闭环。
- [ ] 未破坏现有 Chat UI。
- [ ] TASK-031 可继续做 Agent Debug Workbench。
