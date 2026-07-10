# MVP Demo Script

本文档用于演示 Enterprise Agentic RAG 的最小闭环：

```text
System Ready
-> Login
-> Space
-> Upload / Ingest
-> Agent Debug
-> Assistant
-> Observability
```

## 1. 准备环境

复制环境变量：

```bash
cp .env.example .env
```

确认至少配置：

```text
DATABASE_URL
REDIS_URL
MINIO_*
NEO4J_*
ELASTICSEARCH_*
LLM_*
EMBEDDING_*
RERANKER_*
JWT_SECRET
```

OCR / ASR / Video 默认是 `metadata` fallback。要接真实服务时，将对应 provider 改为 `openai-compatible`，并填写 URL、Key、Model。

## 2. 启动基础设施

```bash
pnpm docker:up
```

生产 compose 配置检查：

```bash
pnpm docker:prod:config
```

## 3. 数据库初始化

开发环境：

```bash
pnpm db:migrate
pnpm db:seed
```

生产或服务器环境：

```bash
pnpm db:deploy
pnpm db:seed
```

默认演示账号：

```text
email: admin@example.com
password: Admin123!
```

## 4. 准备 demo 数据

推荐先用稳定路径，重建演示数据并不启用 Graph extraction：

```bash
pnpm demo:seed --reset --no-graph
```

如需跳过入库，只创建样例 Space / Document / Conversation：

```bash
pnpm demo:seed --no-ingest
```

如需安全重置演示数据但不触发模型调用：

```bash
pnpm demo:reset
```

如需启用 Knowledge Graph：

```bash
pnpm demo:seed --reset --graph
```

输出会包含：

```json
{
  "login": {
    "email": "admin@example.com",
    "password": "Admin123!"
  },
  "space": {
    "id": "..."
  },
  "documents": [],
  "conversation": {
    "id": "..."
  },
  "commands": {
    "demoSmoke": "pnpm demo:smoke ..."
  }
}
```

## 5. Provider smoke

生成安全报告：

```bash
pnpm provider:smoke
```

报告输出在：

```text
docs/demo/reports/
```

报告不会包含 API key、prompt、answer 或文档正文。

## 6. 启动应用

```bash
pnpm dev:backend
pnpm dev:frontend
```

默认地址：

```text
Backend: http://localhost:3000
Frontend: http://localhost:3001
```

## 7. 前端演示路径

1. 打开 `http://localhost:3001`。
2. 在 Login 面板使用 `admin@example.com / Admin123!` 登录。
3. 查看 System Readiness。
4. 选择 `MVP Demo Space`。
5. 查看样例文档和 Pipeline Timeline。
6. 打开 Agent Debug。
7. 输入问题：

```text
单笔超过10000元的报销需要谁审批？
```

8. 观察 streaming events：`thought / retrieval / graph / token / citation / done`。
9. 查看 Citation、Trace Timeline、Execution Timeline、Metrics Breakdown。
10. 切到 Assistant 区域做普通问答演示。

## 8. CLI smoke

执行 `demo:seed` 输出中的 smoke 命令，例如：

```bash
pnpm demo:smoke <userId> <conversationId> "单笔超过10000元的报销需要谁审批？" <spaceId>
```

预期输出：

```json
{
  "answerLength": 120,
  "citationCount": 1,
  "executionId": "...",
  "traceCount": 6,
  "usedGraph": false,
  "usedMemory": true,
  "verified": true
}
```

实际数值会随模型、文档和配置变化。

## 9. 讲解重点

- 文档入库链路：Upload -> MinIO -> DocumentContent -> Chunk -> Embedding -> Search Index。
- 检索链路：PGVector + Elasticsearch + Graph + RRF + Reranker + Permission Filter。
- Agent 链路：LangGraph Runtime + Tool Registry + Memory + Retrieval + Verification。
- 安全边界：Controller 不访问 Prisma / Redis / Neo4j / Provider。
- 可观测性：Health、Readiness、Metrics、Execution Trace、Pipeline Events。
- 企业边界：Tenant、Organization、Department、Space Role、SecurityLevel。

## 10. 常见问题

### Embedding 失败

检查：

```text
EMBEDDING_API_URL
EMBEDDING_API_KEY
EMBEDDING_MODEL
EMBEDDING_DIMENSION
```

### Graph 失败

本地演示可以先用：

```bash
pnpm demo:seed --reset --no-graph
```

默认不启用 graph extraction。确认 Neo4j 和 LLM Graph provider 稳定后再使用 `--graph`。

### Frontend 无法访问 Backend

检查：

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 登录失败

先执行：

```bash
pnpm db:seed
```
