# TASK-053：Review Checklist

## 实现前

- [ ] 阅读现有 Workbench store。
- [ ] 阅读 DocumentListPanel。
- [ ] 阅读 IngestionPanel。
- [ ] 阅读 PipelineTimeline。
- [ ] 确认组件不直接 fetch。

## 实现后

- [ ] 文档状态显示中文。
- [ ] Ingestion 状态显示中文。
- [ ] Pipeline job / event 状态显示中文。
- [ ] Pipeline stage 显示中文阶段名。
- [ ] Pipeline error 显示业务化原因。
- [ ] Ingest 成功后状态保持可见。
- [ ] Ingest 失败后刷新 document / status / pipeline。
- [ ] Upload 成功后选中新文档并刷新状态。
- [ ] 不展示正文、prompt、answer、secret。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`

## Smoke

- [ ] 上传文档后显示“解析中”。
- [ ] 点击入库后显示“处理中”。
- [ ] READY 后显示“可检索”。
- [ ] 失败后显示“解析失败”和阶段原因。
