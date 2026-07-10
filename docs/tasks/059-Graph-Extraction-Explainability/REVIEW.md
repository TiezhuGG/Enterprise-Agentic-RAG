# TASK-059：Review Checklist

## 实现前

- [x] 阅读 IngestionService。
- [x] 阅读 KnowledgeGraphService。
- [x] 阅读 PipelineService metadata sanitization。
- [x] 阅读 GraphBrowser。
- [x] 阅读 workbench pipeline types。

## 实现后

- [x] GraphExtractionResult 包含解释性 metadata。
- [x] graph-extraction success 写入实体数、关系数、实体类型分布。
- [x] graph-extraction skipped 明确 reason。
- [x] graph-extraction failed 不阻断基础入库。
- [x] Graph Browser 展示图谱抽取解释信息。
- [x] 不记录 prompt、answer、document content。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`

## Smoke

- [ ] includeGraph=false 时 Graph Browser 显示跳过原因。
- [ ] includeGraph=true 且成功时展示实体数量、关系数量、类型分布。
- [ ] Graph provider 失败时 Document 仍 READY。
- [ ] Graph provider 失败时 Pipeline Event 标记 FAILED。
- [ ] Graph provider 失败时前端显示安全错误摘要。
