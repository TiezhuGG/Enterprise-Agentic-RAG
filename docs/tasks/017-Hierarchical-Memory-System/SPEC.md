# TASK-017 Hierarchical Memory System Specification

实现分层记忆系统

# 1. Overview

当前系统已经支持：

Conversation

Message

RAG Context

LLM Answer

但是长期运行会产生问题：

1. Message越来越多

2. Prompt Token不断增长

3. 无法跨Conversation记忆用户信息

因此引入分层Memory。

目标：

实现：

Short-term Memory

-

Conversation Summary Memory

-

Long-term User Memory

---

# 2. Memory Architecture

完整链路：

User Question

      |

ChatService

      |

MemoryService

      |

+-----------------------+

| |

Short Memory Long Memory

Redis Mem0

| |

Recent Messages User Facts

| |

+-----------+-----------+

            |

      Memory Context


            |

      Prompt Builder


            |

           LLM

---

# 3. Memory Layers

## 3.1 Short-term Memory

技术：

Redis

作用：

保存最近对话。

策略：

Sliding Window

默认：

最近10轮Message。

数据结构:

memory:conversation:{conversationId}

{

messages:[

{

role:"USER",

content:"xxx"

},

{

role:"ASSISTANT",

content:"xxx"

}

]

}

---

## 3.2 Conversation Summary Memory

作用：

压缩历史消息。

触发条件：

conversation message > N

例如：

20 messages

执行：

Messages

↓

LLM Summary

↓

Redis

保存：

memory:summary:{conversationId}

内容:

用户讨论了xxx问题

关键结论xxx

---

## 3.3 Long-term Memory

技术：

Mem0

作用：

跨Conversation记忆用户。

例如：

用户喜欢：

Java技术栈

用户负责：

财务部门

用户经常查询：

HR制度

---

# 4. Module Structure

新增:

apps/backend/src/modules/memory/

结构:

memory.module.ts

memory.service.ts

memory.types.ts

memory.repository.ts

providers/

redis-memory.provider.ts

mem0.provider.ts

index.ts

---

# 5. Memory Interface

统一接口:

interface MemoryProvider {

save(memory:MemoryItem):Promise<void>

search(query:string):Promise<MemoryItem[]>

delete(id:string):Promise<void>

}

---

# 6. Chat Integration

升级Chat流程:

ChatService

↓

MemoryService.retrieve()

↓

Conversation History

-

Memory Context

-

RAG Context

↓

PromptBuilder

↓

LLM

---

# 7. Redis Design

新增配置:

REDIS_MEMORY_TTL

MEMORY_WINDOW_SIZE

---

# 8. Mem0 Design

新增配置:

MEM0_API_URL

MEM0_API_KEY

Mem0只负责:

用户级长期记忆。

禁止：

Mem0保存Conversation Message。

---

# 9. Prompt Enhancement

Prompt结构:

System

-

Memory Context

-

Conversation Summary

-

Recent Messages

-

Knowledge Context

-

Question

---

# 10. API

新增:

GET /memory

查看当前用户Memory

DELETE /memory/:id

删除Memory

---

# 11. Security

Memory必须绑定userId。

禁止：

用户A读取用户B Memory。

---

# 12. Forbidden

本任务禁止:

❌ Agent

❌ LangGraph

❌ Knowledge Graph

❌ Tool Calling

---

# 13. Future Extension

Agent:

MemoryService

↓

Agent State

Graph:

Memory

↓

Entity Extraction
