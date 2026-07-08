# TASK-034：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请实现 Tool Registry Foundation。

必须遵守：

- 不新增后端 API。
- 不修改前端。
- 不引入 LangGraph。
- 不实现动态 Tool Calling。
- Tool 不得访问 Repository / Prisma / Redis client / Neo4j SDK。
- 保持 Agent streaming API 不变。

必须先阅读：

```text
docs/tasks/034-Tool-Registry-Foundation/SPEC.md
docs/tasks/034-Tool-Registry-Foundation/SEQUENCE.md
docs/tasks/034-Tool-Registry-Foundation/ADR.md
docs/tasks/034-Tool-Registry-Foundation/REVIEW.md
docs/tasks/034-Tool-Registry-Foundation/CODEX.md
```

实现内容：

1. 新增：

```text
apps/backend/src/modules/agent/tools/tool.types.ts
apps/backend/src/modules/agent/tools/tool.registry.ts
```

2. 修改：

- `RetrievalTool`
- `GraphTool`
- `MemoryTool`
- `RetrievalNode`
- `GraphNode`
- `MemoryNode`
- `AgentModule`

3. Node 必须通过 `ToolRegistry.get()` 获取工具。

验证：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

输出：

- 修改文件
- Tool Registry 设计
- 测试结果
