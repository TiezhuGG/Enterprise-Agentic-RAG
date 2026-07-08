# TASK-021 SPEC

## Goal

Implement enterprise AI Assistant frontend.

---

## Technology

Next.js App Router

TypeScript

Tailwind

Zustand

---

# Directory

apps/frontend/

新增：

components/chat/

components/agent/

services/

store/

types/

---

# Features

## 1 Chat Interface

实现：

- message list
- user message
- assistant message
- markdown render
- loading state

---

## 2 Streaming

Consume:

POST /agent/chat/stream

Handle:

thought

retrieval

graph

token

citation

done

error

---

## 3 Agent Trace

展示：

Planner

Retrieval

Graph

Verification

Example:

Agent Steps

✓ Planning

✓ Retrieval

✓ Graph Search

✓ Verification

---

## 4 Citation

展示：

document title

chunk content

source id

---

## 5 Conversation

支持：

conversation list

create conversation

switch conversation

---

# API

services:

agent.service.ts

methods:

chat()

streamChat()

conversation.service.ts

list()

create()

delete()

---

# State

Zustand store:

ChatState

{

conversationId

messages

streaming

trace

citations

}

---

# Rules

禁止：

Component直接调用fetch

禁止：

业务逻辑写入页面

---

# Validation

必须通过:

pnpm lint

pnpm typecheck

pnpm build

Smoke:

登录

创建Conversation

发送问题

看到token流式输出

看到citation

看到agent trace
