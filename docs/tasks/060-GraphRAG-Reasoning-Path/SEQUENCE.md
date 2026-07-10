# TASK-060：Sequence

## GraphRAG 命中流程

```text
Question
-> Planner needsGraph=true
-> GraphNode
-> GraphTool
-> GraphRetrievalService
-> EntityExtractor(query)
-> Neo4j searchByEntityNames(spaceIds, entities)
-> GraphContext.path
-> Agent graph SSE event
-> AnswerNode merge graph context
-> Citation metadata graphPath
-> Agent Debug 展示 reasoning path
```

## 图谱未使用流程

```text
Planner needsGraph=false
-> skip_graph
-> graph SSE 不产生 path
-> done.metadata.usedGraph=false
-> 前端显示 GraphRAG 未使用
```

## 图谱启用但无结果流程

```text
Planner needsGraph=true
-> GraphNode
-> GraphTool 返回 []
-> graph SSE count=0 paths=[]
-> AnswerNode 只使用 retrieval context
-> 前端显示 GraphRAG 未命中
```

## 安全流程

```text
Graph result
-> AccessPolicyService.filterGraphContexts()
-> 只保留授权 space/document
-> Citation / SSE 只输出过滤后的 path
```
