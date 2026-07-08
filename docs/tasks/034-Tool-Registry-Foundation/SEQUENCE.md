# TASK-034：流程设计

## 注册流程

```text
Nest AgentModule
↓
创建 RetrievalTool / GraphTool / MemoryTool
↓
创建 ToolRegistry
↓
ToolRegistry 将工具放入 Map
```

## Retrieval 调用流程

```text
RetrievalNode
↓
ToolRegistry.get('retrieval')
↓
RetrievalTool.invoke({ context, request })
↓
RetrievalService.retrieve()
↓
ContextChunk[]
```

## Graph 调用流程

```text
GraphNode
↓
ToolRegistry.get('graph')
↓
GraphTool.invoke({ context, query, limit })
↓
GraphRetrievalService.retrieve()
↓
GraphContext[]
```

## Memory 调用流程

```text
MemoryNode
↓
ToolRegistry.get('memory')
↓
MemoryTool.invoke({ context, conversationId, question })
↓
MemoryService.getMemory()
↓
MemoryContext
```

## 错误流程

```text
ToolRegistry.get(unknown)
↓
throw Error('Agent tool not registered: {name}')
↓
AgentGraph 捕获并记录 node failed
```

## 兼容性

`AgentService.execute()` 和 `executeStream()` 不改变请求/响应结构。

SSE 事件保持：

- `thought`
- `retrieval`
- `graph`
- `token`
- `citation`
- `done`
- `error`
