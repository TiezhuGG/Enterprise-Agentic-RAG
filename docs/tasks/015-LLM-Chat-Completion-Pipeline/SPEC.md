# TASK-015 LLM Chat Completion Pipeline Specification

# 1. Overview

本任务实现RAG问答生成层。

输入：

用户问题

输出：

AI生成回答

完整Pipeline:

Question

↓

Retrieval

↓

Context

↓

Prompt

↓

LLM

↓

Answer

---

# 2. Architecture

ChatController

      |

ChatService

      |

+-------------+

| |

Retrieval PromptBuilder

| |

+-------------+

      |

LLMProvider

      |

Streaming Response

---

# 3. Module Structure

新增：

apps/backend/src/modules/chat/

结构：

chat.module.ts

chat.controller.ts

chat.service.ts

chat.types.ts

prompt/

prompt.builder.ts

prompt.templates.ts

providers/

llm.provider.ts

openai-compatible.provider.ts

---

# 4. LLM Provider

定义接口：

interface LlmProvider {

chat(

messages:ChatMessage[]

):Promise<string>

stream(

messages:ChatMessage[]

):AsyncIterable<string>

}

---

# 5. Provider Rules

业务层禁止：

- axios调用模型

- OpenAI SDK直接调用

- 读取process.env

HTTP调用只能存在：

providers/

---

# 6. Chat Flow

用户输入：

POST /chat

body:

{
question:string
}

流程：

ChatService

↓

RetrievalService

↓

ContextChunk[]

↓

PromptBuilder

↓

LLMProvider

↓

Answer

---

# 7. Prompt Design

System Prompt:

你是企业知识助手。

只能基于提供的Context回答。

如果Context不存在答案：

明确说明不知道。

---

User Prompt:

Question:

{{question}}

Context:

{{context}}

---

# 8. Streaming

接口：

GET/POST

/chat/stream

返回：

Server Sent Events

格式:

data:{
token:"xxx"
}

---

# 9. Citation

回答支持基础引用。

Context包含：

documentId

chunkId

metadata

生成结果保留引用信息。

---

# 10. Configuration

新增：

LLM_API_URL

LLM_API_KEY

LLM_MODEL

LLM_TEMPERATURE

LLM_MAX_TOKENS

---

# 11. Future Extension

支持：

- LangGraph

- Function Calling

- Memory

- Agent
