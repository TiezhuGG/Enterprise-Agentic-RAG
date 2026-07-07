# ADR-019 LLM Provider Architecture

## Status

Accepted

---

# Context

RAG系统当前已经可以检索知识。

下一步需要接入LLM生成答案。

---

# Decision

采用Provider Pattern。

Architecture:

ChatService

      |

LlmProvider

      |

OpenAICompatibleProvider

---

# Why Provider?

避免业务层绑定模型。

未来支持：

OpenAI

↓

Claude

↓

Gemini

↓

Local Llama

---

# Streaming Decision

采用：

Server Sent Events

原因：

- 简单

- 浏览器原生支持

- 适合Token流输出

---

# Prompt Responsibility

Prompt属于Application Layer。

不属于：

Controller

也不属于：

Provider。

---

# Security Decision

LLM只能消费：

Retrieval产生的Context。

禁止：

直接访问数据库。

---

# Consequence

优点：

- LLM可替换

- 支持流式

- 易扩展Agent

缺点：

增加Provider抽象层。
