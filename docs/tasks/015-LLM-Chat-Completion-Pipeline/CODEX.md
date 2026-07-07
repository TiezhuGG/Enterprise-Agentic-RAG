# TASK-015 LLM Chat Completion Pipeline Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格遵守DDD架构。

=========================

目标

=========================

实现完整RAG问答链路。

流程：

Question

↓

RetrievalService

↓

ContextChunk[]

↓

PromptBuilder

↓

LlmProvider

↓

Answer

=========================

禁止实现

=========================

不要实现：

❌ Agent

❌ LangGraph

❌ Memory

❌ Knowledge Graph

❌ Tool Calling

=========================

新增模块

=========================

创建：

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

=========================

LLM Provider

=========================

实现接口：

interface LlmProvider {

chat(
messages
):Promise<string>

stream(
messages
):AsyncIterable<string>

}

=========================

OpenAI Compatible Provider

=========================

要求：

使用ConfigService

禁止process.env

禁止Controller调用HTTP

新增配置：

LLM_API_URL

LLM_API_KEY

LLM_MODEL

LLM_TEMPERATURE

LLM_MAX_TOKENS

=========================

Chat Service

=========================

流程：

1.

接收question

2.

调用RetrievalService

3.

获得ContextChunk[]

4.

调用PromptBuilder

5.

调用LlmProvider

=========================

Prompt Builder

=========================

生成：

System Message

User Message

格式：

System:

你是企业知识助手。

只能依据Context回答。

User:

Question:

xxx

Context:

xxx

=========================

API

=========================

新增：

POST /chat

返回：

{
answer:string,
citations:[]
}

新增：

POST /chat/stream

返回：

SSE

data:
{
token:""
}

=========================

架构要求

=========================

必须：

ChatService

↓

RetrievalService

ChatService

↓

LlmProvider

禁止：

Controller直接调用LLM。

=========================

测试要求

=========================

验证：

1.

上传企业文档

2.

生成Embedding

3.

调用/chat

验证：

Retrieval成功

Prompt生成成功

LLM返回答案

4.

调用/chat/stream

验证：

token持续返回

输出：

1.

新增目录结构

2.

Chat设计

3.

LLM Provider设计

4.

Prompt设计

5.

Streaming实现

6.

测试结果

7.

未来Memory/Agent接入方式
