# TASK-016 Review Checklist

# Domain

- [ ] Conversation Aggregate

- [ ] Message Entity

- [ ] User隔离

---

# Database

- [ ] Prisma migration

- [ ] User relation

- [ ] Conversation relation

- [ ] Message index

---

# API

- [ ] CRUD Conversation

- [ ] Message history API

---

# Chat Integration

- [ ] Chat绑定conversationId

- [ ] 保存USER消息

- [ ] 保存ASSISTANT消息

---

# Architecture

- [ ] Controller无业务

- [ ] Service不访问Prisma

- [ ] Repository封装DB

---

# Forbidden

禁止：

- Memory

- Redis

- Mem0

- Agent

- LangGraph
