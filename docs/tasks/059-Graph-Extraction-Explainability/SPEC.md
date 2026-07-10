# TASK-059：Graph Extraction Explainability

## 目标

让知识图谱抽取结果变得可解释、可降级、可演示。

当前图谱抽取已经接入 Ingestion Pipeline，但用户只能看到“有没有图谱”。本任务要让用户知道：

- 本次入库是否开启图谱抽取。
- 图谱抽取是成功、跳过还是失败。
- 成功时抽取了多少实体和关系。
- 成功时实体类型分布是什么。
- 失败时为什么失败。
- 图谱失败是否影响基础 RAG 链路。

## 范围

后端：

- 扩展 `KnowledgeGraphService.extractDocumentGraph()` 返回解释性 metadata。
- `graph-extraction` Pipeline stage 写入安全 metadata。
- 图谱抽取失败时记录 failed stage，但不让基础文档入库失败。

前端：

- Graph Browser 展示当前文档最近一次图谱抽取状态。
- 展示实体数量、关系数量、实体类型分布、跳过原因、失败原因。
- 明确展示当前入库选项是否启用图谱抽取。

## 禁止

- 不记录完整 prompt。
- 不记录 LLM 原始回答。
- 不记录 DocumentContent 正文。
- 不新增 Graph 可视化后端 API。
- 不让 Graph Browser 直接访问 Neo4j。
- 不让图谱失败阻断基础文档检索演示。

## 验收标准

- graph-extraction 成功时 metadata 包含实体数、关系数、实体类型分布。
- graph-extraction skipped 时明确包含 reason。
- graph-extraction failed 时 Pipeline Event 标记 FAILED 并包含安全错误信息。
- 图谱抽取失败后 Document 仍可在内容、chunk、embedding 成功时进入 READY。
- Graph Browser 可展示图谱抽取解释信息。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
