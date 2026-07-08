# TASK-021 Implementation

请实现：

docs/tasks/021-Assistant-Frontend-UI/

要求：

## 1 Frontend Architecture

基于现有：

apps/frontend

实现 AI Assistant UI。

---

## 2 Components

新增：

components/chat/

ChatWindow

MessageList

MessageBubble

ChatInput

components/agent/

AgentTracePanel

CitationPanel

---

## 3 API

新增：

services/agent.service.ts

实现：

chat()

streamChat()

必须消费：

POST /agent/chat/stream

---

## 4 Streaming

解析 SSE:

thought

retrieval

graph

token

citation

done

error

---

## 5 State

使用 Zustand。

新增：

store/chat.store.ts

保存：

conversationId

messages

streamingMessage

trace

citations

---

## 6 Rules

禁止：

页面直接fetch

禁止：

组件包含API逻辑

保持：

Component

↓

Store

↓

Service

↓

API

---

## 7 Validation

执行：

pnpm lint

pnpm typecheck

pnpm build

输出：

- 修改文件
- 新组件
- API说明
- 测试结果
