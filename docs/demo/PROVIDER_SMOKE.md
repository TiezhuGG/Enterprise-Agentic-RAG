# Provider Smoke Guide

本文档用于确认 MVP Demo 所需真实服务已经接通。

## 必需服务

基础设施：

- PostgreSQL
- Redis
- MinIO
- Neo4j

模型服务：

- OpenAI-compatible LLM
- OpenAI-compatible Embedding
- OpenAI-compatible Reranker

## 必需环境变量

不要在日志、截图或文档中暴露 API Key。

```text
DATABASE_URL
REDIS_URL
MINIO_ENDPOINT
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET
NEO4J_URI
NEO4J_USERNAME
NEO4J_PASSWORD
LLM_API_URL
LLM_API_KEY
LLM_MODEL
EMBEDDING_API_URL
EMBEDDING_API_KEY
EMBEDDING_MODEL
EMBEDDING_DIMENSION
RERANKER_API_URL
RERANKER_API_KEY
RERANKER_MODEL
```

## 基础检查

配置校验：

```text
pnpm db:validate
```

应用构建：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Docker 配置：

```text
pnpm docker:prod:config
```

健康检查：

```text
GET /health
```

指标检查：

```text
GET /metrics
```

## Agent Smoke

完成 Demo 文档上传和入库后，使用：

```text
pnpm demo:smoke <userId> <conversationId> "单笔超过10000元的报销需要谁审批？" <spaceId>
```

预期输出：

```json
{
  "answerLength": 120,
  "citationCount": 1,
  "executionId": "...",
  "traceCount": 6,
  "usedGraph": true,
  "usedMemory": true,
  "verified": true
}
```

实际数值会随模型、文档和配置变化。

## Ingestion Smoke

已知 `documentId`、`userId`、`spaceId` 时：

```text
pnpm demo:ingest <documentId> <userId> <spaceId> --force
```

如果 Neo4j 或 graph extraction 暂不可用：

```text
pnpm demo:ingest <documentId> <userId> <spaceId> --force --no-graph
```

成功输出应包含：

```text
status = READY
readyForRetrieval = true
stages 包含 document-processing / chunking / embedding / graph-extraction / done
```

## 失败判断

Embedding 不可用时：

```text
stage = embedding
status = failed
Document.status = FAILED
```

Neo4j 不可用且 `includeGraph=true` 时：

```text
stage = graph-extraction
status = failed
Document.status = FAILED
```

LLM 不可用时：

```text
pnpm demo:smoke
```

会失败，并输出模型服务错误摘要。

## 安全要求

- 不截图 API Key。
- 不输出完整 prompt。
- 不输出完整 answer 作为日志。
- 不输出完整 document content。
- Demo 报告只记录 metadata、count、latency、status 和 error message。
