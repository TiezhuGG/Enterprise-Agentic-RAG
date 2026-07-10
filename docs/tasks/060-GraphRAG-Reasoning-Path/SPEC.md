# TASK-060：GraphRAG Reasoning Path

## 目标

让 Agent 使用图谱上下文时，前端可以解释“图谱命中了哪些实体、经过了哪些关系、来自哪些文档”。

当前 GraphRAG 已能把图谱关系作为 citation 返回，但 metadata 粒度不足。本任务要补齐 reasoning path：

- 命中实体。
- 关系类型。
- 起点实体与终点实体。
- 来源文档。
- 图谱来源标记。
- graph skipped / unused 状态。

## 后端范围

- 扩展 `GraphContext`，增加 `path`。
- `KnowledgeGraphRepository.searchByEntityNames()` 返回 path metadata。
- `GraphRetriever` 和 `AnswerNode` 将 path metadata 写入 citation metadata。
- Agent `graph` SSE event 增加 path summary。
- Agent trace metadata 增加 graph path count。

## 前端范围

- Agent Debug Workbench 展示 GraphRAG 路径。
- Citation Inspector 标记来源类型：vector / keyword / graph。
- 图谱引用展示 source -> relation -> target。
- 未使用图谱时明确显示 skipped / unused。

## 禁止

- 不新增 Agent 外部工具。
- 不实现 autonomous agent。
- 不新增 Graph API。
- 不绕过 tenant / space / access policy。
- 不暴露无权限文档信息。
- 不记录完整 prompt、answer、document content。

## 验收标准

- graph retrieval 返回 path metadata。
- graph citation metadata 包含 `retrievalSource='graph'` 和 `graphPath`。
- Agent SSE `graph` 事件包含 path summary。
- 前端 Agent Debug 可展示图谱命中路径。
- 未使用 graph 时前端显示 skipped / unused。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
