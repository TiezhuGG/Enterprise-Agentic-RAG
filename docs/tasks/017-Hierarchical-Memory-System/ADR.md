# ADR-021 Hierarchical Memory Architecture

## Status

Accepted

---

# Context

Conversation已经保存聊天记录。

但是：

- Prompt长度无限增长

- 无法跨会话记忆

- 历史消息无法管理

---

# Decision

采用三层Memory模型。

结构:

Short Memory

-

Summary Memory

-

Long-term Memory

---

# Short Memory Decision

使用Redis。

原因:

- 高性能

- TTL支持

- 适合Session数据

---

# Summary Memory Decision

使用LLM生成摘要。

原因:

完整Message不适合永久进入Prompt。

摘要减少Token消耗。

---

# Long-term Memory Decision

使用Mem0。

原因:

Mem0适合：

- 用户事实

- 偏好

- 长期信息

---

# Separation Rule

Conversation:

保存事实聊天记录。

Memory:

保存可复用信息。

二者不能混合。

---

# Consequence

优势:

- Token成本下降

- 支持长期助手

- 支持Agent

代价:

增加Memory维护逻辑。
