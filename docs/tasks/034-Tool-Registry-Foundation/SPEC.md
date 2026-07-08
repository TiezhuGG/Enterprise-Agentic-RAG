# TASK-034：Tool Registry Foundation

## 目标

建立统一 Agent Tool 调用协议，为后续 LangGraph runtime migration 和循环规划打基础。

当前 `RetrievalTool`、`GraphTool`、`MemoryTool` 是独立注入到 Node 的轻量包装类，缺少统一注册、查询和调用协议。TASK-034 新增 Tool Registry，但不做动态 LLM Tool Calling。

## 范围

新增：

```text
apps/backend/src/modules/agent/tools/tool.types.ts
apps/backend/src/modules/agent/tools/tool.registry.ts
```

修改：

```text
apps/backend/src/modules/agent/tools/retrieval.tool.ts
apps/backend/src/modules/agent/tools/graph.tool.ts
apps/backend/src/modules/agent/tools/memory.tool.ts
apps/backend/src/modules/agent/nodes/retrieval.node.ts
apps/backend/src/modules/agent/nodes/graph.node.ts
apps/backend/src/modules/agent/nodes/memory.node.ts
apps/backend/src/modules/agent/agent.module.ts
```

## Tool 接口

统一接口：

```ts
interface AgentTool<TInput, TOutput> {
  name: string;
  description: string;
  invoke(input: TInput): Promise<TOutput>;
}
```

工具名称：

```ts
type AgentToolName = 'retrieval' | 'graph' | 'memory';
```

## ToolRegistry

`ToolRegistry` 负责：

- 注册 `RetrievalTool`
- 注册 `GraphTool`
- 注册 `MemoryTool`
- 按 name 获取工具
- 工具不存在时抛出明确错误
- 提供 `list()` 供后续调试/观测使用

## 调用方式

Node 仍显式决定调用哪个 Tool，但通过 registry 获取工具：

```text
RetrievalNode -> ToolRegistry.get('retrieval') -> RetrievalTool.invoke()
GraphNode -> ToolRegistry.get('graph') -> GraphTool.invoke()
MemoryNode -> ToolRegistry.get('memory') -> MemoryTool.invoke()
```

## 架构边界

Tool 只调用对应 Service：

- `RetrievalTool -> RetrievalService`
- `GraphTool -> GraphRetrievalService`
- `MemoryTool -> MemoryService`

禁止：

- Tool 访问 Repository
- Tool 访问 Prisma
- Tool 访问 Redis client
- Tool 访问 Neo4j SDK
- Tool 调用模型 Provider

## 禁止项

- 不实现动态 LLM Tool Calling。
- 不修改 Agent API。
- 不修改前端。
- 不引入 LangGraph。
- 不实现循环规划。

## 验收标准

- Retrieval / Graph / Memory 仍可调用。
- Agent streaming API 返回格式不变。
- Node 不再直接注入具体 Tool。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
