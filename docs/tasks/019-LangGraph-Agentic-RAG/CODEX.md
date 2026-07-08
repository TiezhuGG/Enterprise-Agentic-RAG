# TASK-019 Agentic RAG Implementation

你现在负责实现 Enterprise Agentic RAG 项目的 Agent Orchestration Layer。

必须遵守DDD架构。

======================

目标

======================

使用 LangGraph 实现：

Agentic RAG Workflow。

======================

禁止

======================

不要实现：

❌ Multi Agent

❌ Function Calling

❌ External Tool

❌ Autonomous Agent

======================

新增目录

======================

apps/backend/src/modules/agent/

agent.module.ts

agent.service.ts

agent.types.ts

index.ts

graph/

agent.graph.ts

agent.state.ts

nodes/

planner.node.ts

memory.node.ts

retrieval.node.ts

graph.node.ts

answer.node.ts

verification.node.ts

tools/

retrieval.tool.ts

graph.tool.ts

memory.tool.ts

======================

Agent State

======================

实现:

AgentState

包含:

question

conversationId

executionContext

memoryContext

retrievalContext

graphContext

answer

needsGraph

needsRetrieval

verified

======================

LangGraph

======================

实现Graph:

START

-> Memory Node

-> Planner Node

-> Conditional Edge

-> Retrieval Node

-> Graph Node

-> Answer Node

-> Verification Node

-> END

======================

Planner Node

======================

调用LlmProvider。

判断:

simple question:

needsRetrieval=true

needsGraph=false

complex question:

needsRetrieval=true

needsGraph=true

======================

Tool设计

======================

Agent Tool:

只是调用入口。

例如:

RetrievalTool

↓

RetrievalService

禁止:

Tool直接访问Repository。

======================

Chat Integration

======================

修改Chat流程:

ChatController

↓

AgentService

↓

LangGraph

↓

Answer

ChatService 不再负责流程编排。

======================

Security

======================

AgentState必须保存:

ExecutionContext

所有Retrieval:

必须继续使用:

spaceIds

======================

Config

======================

新增:

AGENT_MAX_ITERATIONS

AGENT_ENABLE_GRAPH

AGENT_ENABLE_MEMORY

======================

Testing

======================

验证:

1.

简单问题:

Planner选择Vector Retrieval

2.

复杂问题:

Planner选择Graph Retrieval

3.

Memory Context进入Prompt

4.

权限Context传递

5.

Verification执行

输出:

目录结构

Graph State

Node设计

Workflow

测试结果
