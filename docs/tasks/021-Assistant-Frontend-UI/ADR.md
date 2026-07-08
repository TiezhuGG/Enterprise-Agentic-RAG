# ADR-0011 AI Assistant Frontend Architecture

## Status

Accepted

## Context

TASK-020 已完成 Agent API。

系统已经支持：

- Agent Workflow
- SSE Streaming
- Citation
- Memory
- Retrieval

需要构建企业级 AI Assistant UI。

目标：

- 实时展示回答生成
- 展示 Agent 执行过程
- 展示引用来源
- 支持 Conversation

---

## Decision

采用 Next.js App Router。

Frontend Architecture:

app

↓

features

↓

services

↓

api

---

## UI Components

ChatPage

包含：

ConversationList

ChatWindow

MessageBubble

CitationPanel

AgentTracePanel

InputBox

---

## Streaming

使用浏览器 EventSource API。

流程：

Agent SSE

↓

agent event parser

↓

zustand store

↓

React UI update

---

## State Management

采用 Zustand。

保存：

currentConversation

messages

streamingMessage

agentTrace

---

## API Layer

禁止 Component 直接 fetch。

统一：

services/
agent.service.ts
conversation.service.ts

---

## Consequences

优势：

- UI 与 Agent 解耦
- 支持未来 Copilot UI
- 支持 Trace Visualization
