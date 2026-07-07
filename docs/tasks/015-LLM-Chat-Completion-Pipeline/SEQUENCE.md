# TASK-015 Sequence Diagram

User

|

ChatController

|

ChatService

|

RetrievalService

|

ContextChunk[]

|

PromptBuilder

|

LlmProvider

|

LLM API

|

SSE Stream

---

Streaming Flow:

User

|

POST /chat/stream

|

ChatService

|

LLMProvider.stream()

|

token

|

SSE

|

Frontend
