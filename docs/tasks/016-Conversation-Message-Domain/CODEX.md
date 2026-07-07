# TASK-016 Conversation & Message Domain Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格遵守DDD分层。

=========================

目标

=========================

实现Conversation领域。

让Chat从无状态升级为有状态。

=========================

禁止实现

=========================

不要实现：

❌ Redis Memory

❌ Mem0

❌ LangGraph

❌ Agent

❌ Knowledge Graph

=========================

新增数据库模型

=========================

修改:

apps/backend/prisma/schema.prisma

新增:

Conversation

字段:

id

title

status

userId

createdAt

updatedAt

Message

字段:

id

conversationId

role

content

metadata

createdAt

Relation:

User

|

Conversation

|

Message

=========================

新增模块

=========================

创建:

apps/backend/src/modules/conversation/

结构:

conversation.module.ts

conversation.controller.ts

conversation.service.ts

conversation.repository.ts

conversation.types.ts

entities/

dto/

index.ts

=========================

Repository要求

=========================

Repository负责:

createConversation

findUserConversations

findById

deleteConversation

createMessage

listMessages

Service禁止直接访问Prisma。

=========================

API

=========================

实现:

POST /conversations

创建会话。

---

GET /conversations

查询当前用户会话。

---

GET /conversations/:id

查询详情。

---

DELETE /conversations/:id

软删除。

---

GET /conversations/:id/messages

查询历史消息。

=========================

Chat升级

=========================

修改:

POST /chat/:conversationId

流程:

1.

校验Conversation属于当前用户

2.

保存USER Message

3.

调用RetrievalService

4.

PromptBuilder加入历史消息

5.

调用LlmProvider

6.

保存ASSISTANT Message

7.

返回Answer

=========================

Prompt增强

=========================

Prompt结构:

System:

企业知识助手

History:

previous messages

Context:

retrieved chunks

Question:

current question

=========================

权限

=========================

必须:

用户只能访问自己的Conversation。

=========================

验证

=========================

执行:

pnpm db:migrate

pnpm db:seed

pnpm build

pnpm lint

pnpm typecheck

Smoke:

1.

登录

2.

创建Conversation

3.

发送Chat

4.

查询Messages

5.

确认:

USER message存在

ASSISTANT message存在

Conversation归属正确

输出:

1.

新增目录结构

2.

数据库设计

3.

Conversation设计

4.

Message设计

5.

Chat升级方式

6.

测试结果

7.

未来Memory接入方式
