# MVP Demo Script

本文档用于演示 Enterprise Agentic RAG 的最小闭环。

## 目标

完成下面链路：

```text
登录
-> 创建 Space
-> 上传 sample-policy.md
-> 调用 Ingestion API
-> 创建 Conversation
-> 调用 Agent Streaming
-> 查看 Answer / Citations / Trace / Metrics
```

## 1. 启动基础设施

本地开发：

```text
pnpm docker:up
```

生产 compose 配置检查：

```text
pnpm docker:prod:config
```

如果使用生产 compose：

```text
pnpm docker:prod:up
```

## 2. 数据库初始化

开发环境：

```text
pnpm db:migrate
pnpm db:seed
```

生产环境：

```text
pnpm db:deploy
pnpm db:seed
```

## 3. 启动应用

```text
pnpm dev:backend
pnpm dev:frontend
```

默认地址：

```text
Backend: http://localhost:3001
Frontend: http://localhost:3000
```

实际端口以 `.env` 和 frontend env 配置为准。

## 4. 登录

调用：

```text
POST /auth/login
```

请求：

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

保存返回的 `accessToken`，后续请求使用：

```text
Authorization: Bearer <accessToken>
```

如果 seed 用户不同，以 `apps/backend/src/infrastructure/prisma/seed.ts` 为准。

## 5. 创建 Knowledge Space

```text
POST /spaces
```

请求：

```json
{
  "name": "MVP Demo Space",
  "description": "用于演示企业制度问答闭环",
  "visibility": "PRIVATE"
}
```

保存返回的 `spaceId`。

## 6. 上传样例文档

上传：

```text
POST /spaces/:spaceId/documents/upload
```

multipart 字段：

```text
file = docs/demo/sample-policy.md
title = 企业费用报销与知识库使用制度
description = MVP demo policy document
```

上传成功后保存返回的 `documentId`。

预期 Document 状态：

```text
PROCESSING
```

## 7. 执行完整入库

默认完整链路：

```text
POST /documents/:documentId/ingest
```

请求：

```json
{
  "force": true,
  "includeEmbedding": true,
  "includeGraph": true
}
```

如果本地 Neo4j 或 graph extraction 暂时不可用，可以先跑最小 RAG 闭环：

```json
{
  "force": true,
  "includeEmbedding": true,
  "includeGraph": false
}
```

成功后预期：

```text
Document.status = READY
chunkCount > 0
embeddingCount = chunkCount
```

## 8. 查询入库状态

```text
GET /documents/:documentId/ingest/status
```

预期：

```json
{
  "documentStatus": "READY",
  "hasContent": true,
  "chunkCount": 1,
  "embeddingCount": 1,
  "readyForRetrieval": true
}
```

具体 chunk 数量取决于 splitter 配置和文档长度。

## 9. 创建 Conversation

```text
POST /conversations
```

请求：

```json
{
  "title": "报销制度问答"
}
```

保存返回的 `conversationId`。

## 10. 调用 Agent Streaming

```text
POST /agent/chat/stream
```

请求：

```json
{
  "conversationId": "<conversationId>",
  "question": "单笔超过10000元的报销需要谁审批？"
}
```

前端应看到：

```text
thought
retrieval
graph
token
citation
done
```

如果 `includeGraph=false` 或 `AGENT_ENABLE_GRAPH=false`，graph event 可以为空或被跳过。

## 11. 查看 Metrics

```text
GET /metrics
```

应能看到类似指标：

```text
ingestion_requests_total
ingestion_stage_total
document_processing_total
retrieval_requests_total
agent_workflows_total
llm_requests_total
```

## 12. CLI 辅助命令

已知 `documentId` 和 `userId` 时，可以直接触发入库：

```text
pnpm demo:ingest <documentId> <userId> <spaceId> --force
```

跳过 Graph：

```text
pnpm demo:ingest <documentId> <userId> <spaceId> --force --no-graph
```

对已有 Conversation 执行 Agent smoke：

```text
pnpm demo:smoke <userId> <conversationId> "单笔超过10000元的报销需要谁审批？" <spaceId>
```

## Demo 讲解重点

- `IngestionService` 只负责编排，不直接访问 Prisma、MinIO、Neo4j 或模型 API。
- 文档入库失败会把 Document 标记为 `FAILED`。
- 成功后 Document 标记为 `READY`。
- Agent 回答包含 citation 和 trace。
- `/metrics` 可以观察 ingestion、retrieval、LLM 和 agent workflow。
