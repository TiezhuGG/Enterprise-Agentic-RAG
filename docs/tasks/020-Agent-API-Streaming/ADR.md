# ADR-0010 Agent API 与 Streaming 设计

## Status

Accepted

## Context

TASK-019 已完成 Agent Graph 编排。

目前 AgentService 可以执行完整 Agent Workflow，
但缺少生产级 API 层。

企业 AI Assistant 需要：

- 长任务执行反馈
- Agent 节点状态展示
- Token Streaming
- Citation 返回
- Debug Trace

因此需要设计 Agent API。

---

## Decision

采用独立 Agent Controller。

Controller:
负责 HTTP/SSE 协议。

AgentService:
负责 Agent Workflow 调度。

AgentGraph:
负责节点执行。

禁止：

Controller 调用:

- RetrievalService
- MemoryService
- LlmProvider

---

## API Design

POST /agent/chat

同步模式。

POST /agent/chat/stream

SSE Streaming。

---

## Streaming Event

统一事件格式：

{
type:
"thought"
"retrieval"
"graph"
"token"
"citation"
"done",

data:{}
}

---

## Consequences

优点：

- 前端可展示 Agent 思考过程
- 支持企业级 Copilot UI
- 保持 Agent 与 Transport 解耦

缺点：

增加事件协议维护成本。

---
