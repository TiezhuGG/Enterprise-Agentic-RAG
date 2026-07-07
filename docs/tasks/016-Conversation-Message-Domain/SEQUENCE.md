# TASK-016 Sequence Diagram

## Create Conversation

User

|

ConversationController

|

ConversationService

|

ConversationRepository

|

Database

---

## Chat Flow

User

|

POST /chat/:conversationId

|

ChatController

|

ChatService

|

ConversationRepository

|

Save USER Message

|

RetrievalService

|

PromptBuilder

|

LlmProvider

|

Save ASSISTANT Message

|

Return Answer
