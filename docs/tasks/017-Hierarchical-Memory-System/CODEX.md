# TASK-017 Hierarchical Memory System Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格遵守DDD架构。

=========================

目标

=========================

实现三层Memory系统：

1.

Redis Short-term Memory

2.

Conversation Summary Memory

3.

Mem0 Long-term Memory

=========================

禁止实现

=========================

不要实现：

❌ Agent

❌ LangGraph

❌ Knowledge Graph

❌ Tool Calling

=========================

新增模块

=========================

创建:

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

=========================

Memory Provider

=========================

定义:

interface MemoryProvider {

save()

search()

delete()

}

=========================

Redis Memory

=========================

实现:

Sliding Window

保存:

最近10轮Conversation Message

Key:

memory:conversation:{conversationId}

要求:

使用已有Redis Infrastructure。

禁止:

直接new Redis client。

---

新增配置:

REDIS_MEMORY_TTL

MEMORY_WINDOW_SIZE

=========================

Summary Memory

=========================

实现:

当Message超过20条:

读取历史Messages

↓

调用LlmProvider

↓

生成Summary

↓

保存Redis

Key:

memory:summary:{conversationId}

=========================

Mem0 Provider

=========================

实现接口:

saveMemory()

searchMemory()

要求:

使用ConfigService。

新增:

MEM0_API_URL

MEM0_API_KEY

禁止:

保存完整Conversation。

只保存用户事实。

=========================

Chat Integration

=========================

修改ChatService:

Before:

Conversation History

-

Retrieval Context

After:

Memory Context

-

Conversation History

-

Retrieval Context

流程:

1.

retrieve Memory

2.

retrieve Conversation History

3.

retrieve RAG Context

4.

PromptBuilder

5.

LLM

6.

save Memory

=========================

Prompt升级

结构:

System

Memory Context

Summary

History

Knowledge Context

Question

=========================

API

=========================

新增:

GET /memory

DELETE /memory/:id

=========================

架构要求

=========================

必须:

ChatService

↓

MemoryService

MemoryService

↓

MemoryProvider

禁止:

ChatService直接调用Redis。

禁止:

Memory访问Prisma。

=========================

测试要求

=========================

验证:

1.

连续发送10轮消息

2.

Redis存在conversation memory

3.

超过20条触发summary

4.

跨Conversation查询Memory

5.

用户隔离测试

输出:

1.

目录结构

2.

Memory设计

3.

Redis实现

4.

Summary实现

5.

Mem0实现

6.

Chat集成

7.

测试结果
