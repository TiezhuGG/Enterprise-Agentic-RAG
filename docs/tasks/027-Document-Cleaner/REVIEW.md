# TASK-027 Review Checklist

## 实现前

- [ ] 已阅读 `SPEC.md`。
- [ ] 已阅读 `SEQUENCE.md`。
- [ ] 已阅读 `ADR.md`。
- [ ] 已阅读 `REVIEW.md`。
- [ ] 已阅读 `CODEX.md`。
- [ ] 确认本任务不改数据库 schema。
- [ ] 确认本任务不做 Metadata / Event / Job。

## 架构

- [ ] Parser 不包含 Cleaner 逻辑。
- [ ] Cleaner 位于 `document-processing/cleaners`。
- [ ] `DocumentProcessingService` 通过 `CleanerPipeline` 调用清洗。
- [ ] Cleaner 不访问 Prisma。
- [ ] Cleaner 不访问 StorageService。
- [ ] Cleaner 不调用模型 Provider。
- [ ] Cleaner 不读取 `process.env`。

## 功能

- [ ] 统一换行符为 `\n`。
- [ ] 移除无效控制字符。
- [ ] 去除普通 Markdown 行的行尾空白。
- [ ] 连续空行最多保留 2 行。
- [ ] Markdown heading 保留。
- [ ] Markdown table 保留。
- [ ] Markdown list 保留。
- [ ] code fence 内空行不被压缩。
- [ ] 无一级或二级标题时添加 `# {document.title}`。
- [ ] 已有一级或二级标题时不重复添加标题。
- [ ] 清洗后空内容会失败。

## Observability

- [ ] 成功日志包含 cleaning metadata。
- [ ] 失败日志不泄露正文。
- [ ] 不记录 raw content。
- [ ] 不记录 cleaned content。

## 验证

必须执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

推荐执行：

```text
pnpm db:validate
```

如有真实 documentId/userId/spaceId，再执行：

```text
pnpm demo:ingest <documentId> <userId> <spaceId> --force --no-graph
```

## 输出

完成后输出：

- 修改文件列表。
- Cleaner 设计说明。
- Document Processing 流程变化。
- 验证结果。
- 已知限制。
- 后续 TASK-028 建议。
