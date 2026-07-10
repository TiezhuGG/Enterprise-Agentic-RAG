# TASK-060：ADR

## 决策

GraphRAG reasoning path 作为 `GraphContext.path` 与 citation metadata 传播，不新增数据库模型。

## 原因

- 图谱路径本质上是检索结果解释，不是新的业务实体。
- Neo4j 已经保存实体与关系，检索时可以构造 path。
- Citation metadata 是回答可信度展示的自然承载位置。

## Path 数据结构

第一版只支持一跳关系：

```ts
{
  source: { id, name, type },
  relation: { type },
  target: { id, name, type },
  documentId,
  spaceId
}
```

后续二跳 / 多跳路径可以扩展为 `segments[]`。

## 安全取舍

Path 必须在权限过滤后才进入 Agent state 与 SSE。

这意味着：

- 无权限图谱关系不会进入 path。
- Citation 不泄露无权限 documentId。
- 前端只展示后端返回的 path，不自行查询 Neo4j。

## 后果

- Agent Debug 能解释复杂问题的 GraphRAG 路径。
- Citation 能区分 graph / vector / keyword 来源。
- 后续 GraphRAG Reasoning UI 可以复用同一 metadata。
