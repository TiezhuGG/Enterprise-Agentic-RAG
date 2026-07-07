# TASK-016 Conversation & Message Domain Specification

# 1. Overview

本任务实现聊天会话领域。

目标：

将当前无状态 Chat API 升级为有状态 Conversation Chat。

Before:

User

↓

Question

↓

Answer

After:

User

↓

Conversation

↓

Message[]

↓

ChatService

↓

LLM

↓

Message

---

# 2. Domain Design

核心实体：

## Conversation

表示一次持续性的聊天会话。

字段：

id

title

userId

status

createdAt

updatedAt

---

## Message

表示一次消息。

字段：

id

conversationId

role

content

metadata

createdAt

role:

USER

ASSISTANT

SYSTEM

---

# 3. Database Design

新增 Prisma Model:

Conversation

关系:

User 1:N Conversation

Conversation 1:N Message

Message:

Conversation

|

Message

|

Message

|

Message

---

# 4. Module Structure

新增:

apps/backend/src/modules/conversation/

结构:

conversation.module.ts

conversation.controller.ts

conversation.service.ts

conversation.repository.ts

conversation.types.ts

entities/

dto/

index.ts

---

# 5. API Design

## Create Conversation

POST /conversations

Response:

{
id,
title
}

---

## List Conversations

GET /conversations

返回当前用户会话列表。

---

## Get Conversation

GET /conversations/:id

---

## Delete Conversation

DELETE /conversations/:id

软删除。

---

# 6. Message Design

新增接口：

GET /conversations/:id/messages

查询历史消息。

---

# 7. Chat Integration

升级现有 Chat API。

Before:

POST /chat

{
question
}

After:

POST /chat/:conversationId

{
message
}

流程:

ChatController

↓

ChatService

↓

保存 USER Message

↓

Retrieval

↓

Prompt Builder

↓

LLM

↓

保存 ASSISTANT Message

↓

Return Answer

---

# 8. Permission

Conversation 属于 User。

只能访问自己的 Conversation。

禁止跨用户读取。

---

# 9. Architecture Rules

Controller:

只处理HTTP。

Service:

负责业务流程。

Repository:

负责数据库。

禁止:

Controller访问Prisma。

ChatService直接写SQL。

---

# 10. Future Extension

Memory:

Conversation

↓

Message History

↓

Short Memory

↓

Long Memory

Agent:

Conversation

↓

Agent State

↓

Tools
