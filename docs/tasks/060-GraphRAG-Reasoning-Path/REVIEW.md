# TASK-060：Review Checklist

## 实现前

- [x] 阅读 RetrievalService。
- [x] 阅读 GraphRetriever。
- [x] 阅读 GraphRetrievalService。
- [x] 阅读 KnowledgeGraphRepository。
- [x] 阅读 AgentGraph SSE event。
- [x] 阅读 Agent Debug 前端。

## 实现后

- [x] GraphContext 增加 path metadata。
- [x] Neo4j graph retrieval 返回 source / relation / target path。
- [x] GraphRetriever citation metadata 包含 graphPath 和 retrievalSource。
- [x] AnswerNode graph citation metadata 包含 graphPath 和 retrievalSource。
- [x] Agent graph SSE event 包含 path summary。
- [x] Agent trace graph metadata 包含 graphPathCount 和 graphPaths。
- [x] Agent Debug 展示 GraphRAG 路径。
- [x] Citation Inspector 标记 graph / vector / keyword / hybrid 来源。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

## Smoke

- [ ] 复杂问题触发 `needsGraph=true`。
- [ ] `graph` event 展示 count 和 paths。
- [ ] graph citation 展示 source -> relation -> target。
- [ ] 未使用 graph 时显示 skipped / unused。
- [ ] 无权限图谱结果不进入 citation。

> Smoke 需要运行中的 Neo4j、模型 provider、已完成图谱抽取的演示数据；本次只完成静态验证和构建验证。
