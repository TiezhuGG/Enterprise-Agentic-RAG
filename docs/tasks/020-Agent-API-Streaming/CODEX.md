你现在实现 TASK-020。

请严格遵守：

docs/tasks/020-Agent-API-Streaming/SPEC.md

docs/tasks/020-Agent-API-Streaming/SEQUENCE.md

目标：

将 TASK-019 Agent Workflow 暴露为生产级 API。

要求：

1.

新增 AgentController。

2.

新增：

POST /agent/chat

POST /agent/chat/stream

3.

AgentService 增加：

execute()

executeStream()

4.

AgentState 增加：

executionId

trace

citations

5.

Streaming 使用 SSE。

6.

事件格式：

{
type,
data
}

支持：

thought

retrieval

graph

token

citation

done

7.

Controller 不允许：

访问 Repository

访问 Prisma

访问 Redis

访问 Neo4j

调用 Provider

8.

保持现有架构：

Controller

↓

Service

↓

AgentGraph

↓

Nodes

9.

完成后执行：

pnpm format:check

pnpm lint

pnpm typecheck

pnpm build

10.

输出：

- 修改文件列表
- 新增目录
- API说明
- 测试结果
- 后续建议
