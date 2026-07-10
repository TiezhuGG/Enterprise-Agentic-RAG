# TASK-059：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Graph Extraction Explainability。

必须遵守：

- 先读本目录下 `SPEC.md`、`SEQUENCE.md`、`ADR.md`、`REVIEW.md`。
- 不新增无必要后端 API。
- 不新增数据库表。
- 不让图谱失败阻断基础 RAG 入库。
- 不记录 prompt、answer、document content、API key、token。
- 前端保持 `Component -> Store -> Service -> API`。

实现重点：

- `KnowledgeGraphService.extractDocumentGraph()` 返回实体类型分布、chunk 数等解释性 metadata。
- `IngestionService` 的 graph-extraction stage 写入解释性 metadata。
- graph-extraction 失败只记录 failed stage，不抛出到整体 ingestion。
- Graph Browser 展示当前文档最近一次 graph-extraction 状态、数量、类型分布、跳过/失败原因。

完成后执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

输出：

- 修改文件
- 后端 Graph extraction 变化
- 前端 Graph Browser 变化
- 测试结果
