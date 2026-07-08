# TASK-021 Sequence

# Open Chat

User

↓

Next.js Page

↓

Conversation Service

↓

Create Conversation

↓

Chat Store

↓

Chat Window

---

# Send Question

User Input

↓

agent.service.streamChat()

↓

POST /agent/chat/stream

↓

SSE

↓

Event Parser

Events:

thought

↓

retrieval

↓

graph

↓

token

↓

citation

↓

done

↓

Update Zustand

↓

React Render

---

# Citation Flow

Agent API

↓

citation event

↓

Chat Store

↓

Citation Panel

---

# Error Flow

SSE error

↓

Store error

↓

UI Error Message
