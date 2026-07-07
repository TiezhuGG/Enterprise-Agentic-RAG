# ADR-020 Conversation Domain Architecture

## Status

Accepted

---

# Context

当前Chat API无状态。

无法支持:

- 多轮对话

- Memory

- 用户历史

- Agent State

---

# Decision

引入Conversation作为聚合根。

Domain:

User

|

Conversation

|

Message

---

# Why Conversation?

因为企业AI助手需要：

1. 用户隔离

每个用户拥有自己的会话。

2. 历史追踪

保存完整问答链路。

3. Memory基础

后续Memory直接消费Message。

---

# Message Role Design

采用OpenAI兼容设计：

USER

ASSISTANT

SYSTEM

原因：

未来方便接入不同LLM。

---

# Soft Delete Decision

Conversation采用软删除。

原因:

- 审计

- 数据恢复

- 企业合规

---

# Consequence

优势:

- 支持多轮聊天

- 支持Memory

- 支持Agent

成本:

增加Conversation维护逻辑。
