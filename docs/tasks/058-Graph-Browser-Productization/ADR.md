# TASK-058：ADR

## 决策

第一版 Graph Browser 不新增后端 API，使用现有 GraphView 完成搜索、过滤和一跳 / 二跳展开。

## 原因

- 现有 API 已有 spaceId / documentId 权限过滤。
- MVP 演示更需要可浏览体验，而不是复杂图查询语言。
- 前端邻接展开足够支持小规模演示图谱。

## 展示策略

- Graph Canvas 使用轻量 SVG + HTML 节点，不引入大型图可视化库。
- 关系列表作为可读解释面板。
- 节点详情展示 type、documentId、spaceId、邻居数量。
- 节点类型过滤从当前 GraphView 动态计算。

## 限制

- 不做力导向布局。
- 不做无限图谱懒加载。
- 不做 Neo4j Cypher 控制台。
- 不做 Graph Visualization 高级交互库。
- 不展示无权限文档内容。

## 后果

- TASK-059 可补 Graph Extraction Explainability。
- TASK-060 可补 GraphRAG Reasoning Path。
- 如未来图谱规模变大，再新增后端 neighborhood API。
