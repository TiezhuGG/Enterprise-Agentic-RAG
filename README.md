# Enterprise Agentic RAG

面向企业知识治理与可信问答的 Agentic RAG 平台  
An Agentic RAG platform for enterprise knowledge governance and trustworthy question answering

[简体中文](#简体中文) · [English](#english)

---

## 简体中文

### 项目简介

Enterprise Agentic RAG 是一个基于 TypeScript monorepo 构建的企业级检索增强生成平台。系统覆盖文档摄取、混合检索、GraphRAG、智能体编排、租户级权限控制、执行链路追踪与 RAG 评估，并提供完整的管理控制台与问答工作台。

核心技术栈：NestJS 11、Next.js 15、React 19、LangGraph、Prisma、PostgreSQL/pgvector、Elasticsearch、Redis、MinIO、Neo4j 与 Docker Compose。

```text
文档 / 多模态文件
  -> 解析、清洗、分块与向量化
  -> pgvector + Elasticsearch + Neo4j
  -> 权限过滤 + RRF 融合 + 重排序
  -> LangGraph Agent + 记忆 + 答案验证
  -> 引用、执行轨迹与成本指标
```

### 核心特性

- **多路混合检索**：融合 pgvector 语义检索、Elasticsearch BM25 全文检索与 Neo4j 图谱检索，支持 RRF（Reciprocal Rank Fusion）和重排序。
- **Agentic 工作流**：基于 LangGraph 实现规划、检索、图谱推理、生成与答案验证，支持同步响应和 SSE 流式输出。
- **企业级知识治理**：提供租户、组织、部门、知识空间、成员、角色、权限、安全等级与文档访问范围控制。
- **文档摄取流水线**：支持对象存储、异步任务、语义分块、嵌入、索引、知识图谱抽取、版本管理及失败重试。
- **多模态扩展**：抽象 OCR、ASR 与视频理解 Provider；可使用元数据降级模式或 OpenAI-compatible 服务。
- **可观测性与评估**：提供健康检查、就绪探针、执行时间线、检索证据、Token/成本指标及 RAG 评估脚手架。
- **工程化交付**：采用 pnpm workspace，集成 ESLint、Prettier、TypeScript、Husky、GitHub Actions、容器化部署与健康检查。

### 环境要求

| 组件           | 最低要求                      | 用途                        |
| -------------- | ----------------------------- | --------------------------- |
| Node.js        | `>= 20.11.0`                  | 应用运行时                  |
| pnpm           | `>= 9.0.0`；项目锁定 `11.7.0` | monorepo 包管理             |
| Docker Engine  | 建议 24+                      | 基础设施及生产部署          |
| Docker Compose | v2                            | 服务编排                    |
| 内存           | 本地开发建议 8 GB+            | Elasticsearch、Neo4j 等服务 |

模型侧需提供 OpenAI-compatible 的 LLM、Embedding 与 Reranker HTTP 接口。默认示例地址为本机 Ollama 的 `http://localhost:11434`；请确保相应模型与端点实际可用。当前向量模式固定为 **768 维**。

### 安装步骤

1. 克隆仓库并安装依赖：

```bash
git clone <your-repository-url>
cd Enterprise-Agentic-RAG
corepack enable
pnpm install --frozen-lockfile
```

2. 创建本地配置：

```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

3. 编辑 `.env`，至少确认 JWT 密钥、数据库连接以及 LLM、Embedding、Reranker Provider 配置。随后启动基础设施：

```bash
pnpm docker:up
```

4. 初始化数据库：

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

5. 验证 Provider 并启动开发服务：

```bash
pnpm provider:smoke
pnpm dev
```

| 服务          | 默认地址                                 |
| ------------- | ---------------------------------------- |
| Web 控制台    | `http://localhost:3001`                  |
| Backend API   | `http://localhost:3000`                  |
| 健康检查      | `http://localhost:3000/health`           |
| 就绪检查      | `http://localhost:3000/health/readiness` |
| MinIO Console | `http://localhost:9001`                  |
| Neo4j Browser | `http://localhost:7474`                  |

> `pnpm db:seed` 创建 `admin@example.com / 123456`；仅限本地开发，首次使用后应立即修改。执行 `pnpm demo:seed --reset --no-graph` 会创建或重置演示账号为 `admin@example.com / Admin123!`。

### 配置参数

以 [`.env.example`](./.env.example) 和 [`.env.production.example`](./.env.production.example) 为配置基准。主要参数如下：

| 参数                                             | 说明                                 | 默认示例                 |
| ------------------------------------------------ | ------------------------------------ | ------------------------ |
| `APP_ENV`, `APP_PORT`                            | 运行环境与后端端口                   | `local`, `3000`          |
| `CORS_ORIGINS`                                   | 允许的前端 Origin，逗号分隔          | `http://localhost:3001`  |
| `DATABASE_URL`                                   | PostgreSQL/pgvector 连接串           | `postgresql://...`       |
| `REDIS_URL`                                      | Redis 连接地址                       | `redis://localhost:6379` |
| `ELASTICSEARCH_URL`                              | Elasticsearch 服务地址               | `http://localhost:9200`  |
| `ELASTICSEARCH_ENABLE_FALLBACK`                  | ES 不可用时是否允许降级              | `true`                   |
| `MINIO_ENDPOINT`, `MINIO_*`                      | 对象存储地址、凭据与 Bucket          | `http://localhost:9000`  |
| `NEO4J_URI`, `NEO4J_*`                           | Neo4j HTTP 地址与凭据                | `http://localhost:7474`  |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                   | JWT 签名密钥（至少 32 字符）与有效期 | `1h`                     |
| `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`        | 对话模型 Provider                    | OpenAI-compatible        |
| `EMBEDDING_API_URL`, `EMBEDDING_MODEL`           | 嵌入模型 Provider                    | `nomic-embed-text`       |
| `EMBEDDING_DIMENSION`                            | 向量维度；当前必须为 `768`           | `768`                    |
| `RERANKER_API_URL`, `RERANKER_MODEL`             | 重排序 Provider                      | `bge-reranker-v2-m3`     |
| `AGENT_MAX_ITERATIONS`                           | Agent 最大迭代次数                   | `8`                      |
| `AGENT_ENABLE_GRAPH`, `AGENT_ENABLE_MEMORY`      | 图谱推理与记忆开关                   | `true`                   |
| `OCR_PROVIDER`, `ASR_PROVIDER`, `VIDEO_PROVIDER` | `metadata` 或 `openai-compatible`    | `metadata`               |
| `MULTIMODAL_MAX_FILE_SIZE_MB`                    | 多模态附件大小上限，范围 1–100 MB    | `25`                     |
| `INGESTION_WORKER_ENABLED`                       | 是否在当前进程运行摄取 Worker        | `true`                   |
| `NEXT_PUBLIC_API_BASE_URL`                       | 前端访问的 API 基础地址              | `http://localhost:3000`  |
| `COST_*_PER_1K`                                  | 每千 Token 的成本计价参数            | `0`                      |

当 OCR、ASR 或 Video Provider 设为 `openai-compatible` 时，对应的 `*_API_URL`、`*_API_KEY` 与 `*_MODEL` 均为必填项。不要提交 `.env` 或任何真实凭据。

### 快速示例

#### 初始化演示知识库

```bash
pnpm demo:seed --reset --no-graph
```

如 Provider 与 Neo4j 已正确配置，可将 `--no-graph` 替换为 `--graph`。

#### 调用 Agent API

以下示例使用 `jq` 提取接口返回值：

```bash
API_URL=http://localhost:3000

TOKEN=$(curl -sS -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.accessToken')

CONVERSATION_ID=$(curl -sS -X POST "$API_URL/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Quick Start"}' \
  | jq -r '.id')

curl -sS -X POST "$API_URL/agent/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONVERSATION_ID\",\"question\":\"单笔超过 10000 元的报销需要谁审批？\",\"limit\":5}"
```

响应包含 `executionId`、`answer`、`citations` 以及验证、图谱和执行轨迹元数据。流式调用使用 `POST /agent/chat/stream`，响应类型为 `text/event-stream`。

### 部署方式

#### Docker Compose 生产部署

```bash
cp .env.production.example .env.production
# 修改全部 change-me 占位符，并配置公网 API 地址与 CORS
pnpm deploy:prod:dry-run
pnpm deploy:prod
```

常用运维命令：

```bash
pnpm docker:prod:logs
pnpm deploy:prod:smoke
pnpm docker:prod:down
```

部署脚本会校验配置、构建并启动服务、等待健康检查、执行 Prisma migration 和 Provider smoke test。生产环境默认不填充账号；如需初始化基础数据或演示数据，可显式执行：

```bash
pnpm deploy:prod -- --seed
pnpm deploy:prod -- --seed --demo --graph
```

#### 单服务器与 CI/CD

项目同时提供基于 GHCR、GitHub Actions、Caddy 和自动健康回滚的单服务器部署方案。详见：

- [单服务器演示部署](./docs/deployment/SINGLE_SERVER_DEMO.md)
- [在线演示部署指南](./docs/demo/ONLINE_DEMO_DEPLOYMENT.md)
- [生产部署检查清单](./docs/demo/DEPLOYMENT_CHECKLIST.md)

生产环境应使用独立强密码、HTTPS、最小暴露端口、持久卷备份及受控的 CORS；不得使用示例账号或示例密钥。

### 常见问题

**1. 后端启动时报 `Invalid environment configuration`。**  
配置由 Zod 严格校验。请对照 `.env.example` 补齐变量，确保 `JWT_SECRET` 至少 32 字符、URL 格式有效且 `EMBEDDING_DIMENSION=768`。

**2. `provider:smoke` 无法连接模型服务。**  
确认 Provider 地址、密钥和模型名称有效。应用在容器内运行时，宿主机服务通常应使用 `host.docker.internal`，不能使用容器自身的 `localhost`。

**3. Elasticsearch 启动失败或被系统终止。**  
为 Docker 分配足够内存；Linux 主机通常还需设置 `vm.max_map_count=262144`。可查看 `docker compose` 日志定位具体原因。

**4. 登录提示账号或密码错误。**  
确认执行的是 `db:seed` 还是 `demo:seed`：两者默认密码不同。重新执行 seed 会覆盖对应演示管理员的密码。

**5. 检索结果为空。**  
确认文档摄取任务已完成、Embedding 模型维度为 768、Elasticsearch 索引可用，并检查用户是否拥有目标知识空间及文档访问权限。必要时执行 `pnpm search:reindex`。

**6. GraphRAG 或记忆服务不可用。**  
检查 Neo4j/Mem0 连通性；本地排障时可暂时设置 `AGENT_ENABLE_GRAPH=false` 或 `AGENT_ENABLE_MEMORY=false`，基础检索链路仍可运行。

### 开源协议

当前仓库未包含 `LICENSE` 文件，因此尚未授予复制、修改、分发或商业使用许可。若维护者计划开源，请在发布前添加明确的许可证文件（如 Apache-2.0 或 MIT），并同步更新本节。第三方依赖仍分别受其自身许可证约束。

---

## English

### Overview

Enterprise Agentic RAG is an enterprise-grade retrieval-augmented generation platform implemented as a TypeScript monorepo. It covers document ingestion, hybrid retrieval, GraphRAG, agent orchestration, tenant-aware authorization, execution tracing, and RAG evaluation, with an integrated administration console and assistant workbench.

The primary stack includes NestJS 11, Next.js 15, React 19, LangGraph, Prisma, PostgreSQL/pgvector, Elasticsearch, Redis, MinIO, Neo4j, and Docker Compose.

```text
Documents / multimodal assets
  -> parsing, normalization, chunking, and embedding
  -> pgvector + Elasticsearch + Neo4j
  -> permission filtering + RRF fusion + reranking
  -> LangGraph Agent + memory + answer verification
  -> citations, execution traces, and cost metrics
```

### Core Features

- **Hybrid retrieval** combining pgvector semantic search, Elasticsearch BM25, and Neo4j graph retrieval with Reciprocal Rank Fusion and reranking.
- **Agentic workflow** for planning, retrieval, graph reasoning, generation, and verification, with synchronous and SSE streaming APIs.
- **Enterprise knowledge governance** across tenants, organizations, departments, knowledge spaces, memberships, RBAC, security levels, and document access scopes.
- **Document ingestion pipeline** with object storage, asynchronous jobs, semantic chunking, embeddings, indexing, knowledge graph extraction, versioning, and retry support.
- **Multimodal provider boundary** for OCR, ASR, and video understanding through metadata fallback or OpenAI-compatible services.
- **Observability and evaluation** through health/readiness endpoints, execution timelines, retrieval evidence, token/cost metrics, and RAG evaluation scaffolding.
- **Production-oriented engineering** with pnpm workspaces, ESLint, Prettier, TypeScript, Husky, GitHub Actions, container packaging, and health checks.

### Requirements

| Component      | Requirement                       | Purpose                                    |
| -------------- | --------------------------------- | ------------------------------------------ |
| Node.js        | `>= 20.11.0`                      | Application runtime                        |
| pnpm           | `>= 9.0.0`; pinned to `11.7.0`    | Monorepo package management                |
| Docker Engine  | 24+ recommended                   | Infrastructure and deployment              |
| Docker Compose | v2                                | Service orchestration                      |
| Memory         | 8 GB+ recommended for development | Elasticsearch, Neo4j, and related services |

OpenAI-compatible LLM, embedding, and reranker endpoints are required. The example configuration targets a local Ollama service at `http://localhost:11434`; ensure the referenced models and endpoints are available. The current vector schema requires **768-dimensional embeddings**.

### Installation

1. Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd Enterprise-Agentic-RAG
corepack enable
pnpm install --frozen-lockfile
```

2. Create the local environment file:

```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

3. Review `.env`, especially the JWT secret, database connection, and model provider settings. Start the infrastructure services:

```bash
pnpm docker:up
```

4. Initialize the database:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

5. Verify the providers and start both applications:

```bash
pnpm provider:smoke
pnpm dev
```

| Service       | Default URL                              |
| ------------- | ---------------------------------------- |
| Web console   | `http://localhost:3001`                  |
| Backend API   | `http://localhost:3000`                  |
| Liveness      | `http://localhost:3000/health`           |
| Readiness     | `http://localhost:3000/health/readiness` |
| MinIO Console | `http://localhost:9001`                  |
| Neo4j Browser | `http://localhost:7474`                  |

> `pnpm db:seed` creates `admin@example.com / 123456` for local development only. `pnpm demo:seed --reset --no-graph` creates or resets the demo account to `admin@example.com / Admin123!`. Change default credentials immediately.

### Configuration

Use [`.env.example`](./.env.example) and [`.env.production.example`](./.env.production.example) as the authoritative templates.

| Variable                                         | Description                                             | Example default          |
| ------------------------------------------------ | ------------------------------------------------------- | ------------------------ |
| `APP_ENV`, `APP_PORT`                            | Runtime environment and backend port                    | `local`, `3000`          |
| `CORS_ORIGINS`                                   | Comma-separated allowed frontend origins                | `http://localhost:3001`  |
| `DATABASE_URL`                                   | PostgreSQL/pgvector connection string                   | `postgresql://...`       |
| `REDIS_URL`                                      | Redis endpoint                                          | `redis://localhost:6379` |
| `ELASTICSEARCH_URL`                              | Elasticsearch endpoint                                  | `http://localhost:9200`  |
| `ELASTICSEARCH_ENABLE_FALLBACK`                  | Allow degraded search when Elasticsearch is unavailable | `true`                   |
| `MINIO_ENDPOINT`, `MINIO_*`                      | Object storage endpoint, credentials, and bucket        | `http://localhost:9000`  |
| `NEO4J_URI`, `NEO4J_*`                           | Neo4j HTTP endpoint and credentials                     | `http://localhost:7474`  |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                   | JWT secret (minimum 32 characters) and lifetime         | `1h`                     |
| `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`        | Chat model provider                                     | OpenAI-compatible        |
| `EMBEDDING_API_URL`, `EMBEDDING_MODEL`           | Embedding provider                                      | `nomic-embed-text`       |
| `EMBEDDING_DIMENSION`                            | Vector dimension; currently fixed at `768`              | `768`                    |
| `RERANKER_API_URL`, `RERANKER_MODEL`             | Reranking provider                                      | `bge-reranker-v2-m3`     |
| `AGENT_MAX_ITERATIONS`                           | Maximum agent iterations                                | `8`                      |
| `AGENT_ENABLE_GRAPH`, `AGENT_ENABLE_MEMORY`      | Graph reasoning and memory toggles                      | `true`                   |
| `OCR_PROVIDER`, `ASR_PROVIDER`, `VIDEO_PROVIDER` | `metadata` or `openai-compatible`                       | `metadata`               |
| `MULTIMODAL_MAX_FILE_SIZE_MB`                    | Attachment limit from 1 to 100 MB                       | `25`                     |
| `INGESTION_WORKER_ENABLED`                       | Run the ingestion worker in the current process         | `true`                   |
| `NEXT_PUBLIC_API_BASE_URL`                       | Backend base URL used by the frontend                   | `http://localhost:3000`  |
| `COST_*_PER_1K`                                  | Cost rates per 1,000 tokens                             | `0`                      |

When an OCR, ASR, or video provider is set to `openai-compatible`, its `*_API_URL`, `*_API_KEY`, and `*_MODEL` values are mandatory. Never commit `.env` files or production credentials.

### Quick Example

Seed the demonstration knowledge base:

```bash
pnpm demo:seed --reset --no-graph
```

Replace `--no-graph` with `--graph` when Neo4j and the required providers are ready. The following API example requires `curl` and `jq`:

```bash
API_URL=http://localhost:3000

TOKEN=$(curl -sS -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.accessToken')

CONVERSATION_ID=$(curl -sS -X POST "$API_URL/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Quick Start"}' \
  | jq -r '.id')

curl -sS -X POST "$API_URL/agent/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONVERSATION_ID\",\"question\":\"Who must approve an expense above CNY 10,000?\",\"limit\":5}"
```

The response includes `executionId`, `answer`, `citations`, and verification, graph, and trace metadata. Use `POST /agent/chat/stream` for a `text/event-stream` response.

### Deployment

#### Production Docker Compose

```bash
cp .env.production.example .env.production
# Replace every change-me placeholder and configure public API/CORS URLs.
pnpm deploy:prod:dry-run
pnpm deploy:prod
```

Common operational commands:

```bash
pnpm docker:prod:logs
pnpm deploy:prod:smoke
pnpm docker:prod:down
```

The deployment script validates configuration, builds and starts services, waits for health checks, deploys Prisma migrations, and runs provider smoke tests. Production deployment does not seed accounts unless explicitly requested:

```bash
pnpm deploy:prod -- --seed
pnpm deploy:prod -- --seed --demo --graph
```

#### Single-server deployment and CI/CD

The repository also provides a GHCR, GitHub Actions, Caddy, and health-based rollback workflow:

- [Single-server demo deployment](./docs/deployment/SINGLE_SERVER_DEMO.md)
- [Online demo deployment guide](./docs/demo/ONLINE_DEMO_DEPLOYMENT.md)
- [Production deployment checklist](./docs/demo/DEPLOYMENT_CHECKLIST.md)

Use independent strong secrets, HTTPS, minimal port exposure, persistent-volume backups, and restrictive CORS in production. Do not retain example credentials or keys.

### FAQ

**1. The backend reports `Invalid environment configuration`.**  
Environment variables are validated strictly with Zod. Compare the file against `.env.example`; ensure the JWT secret contains at least 32 characters, all URLs are valid, and `EMBEDDING_DIMENSION=768`.

**2. `provider:smoke` cannot reach a model service.**  
Verify the endpoint, API key, and model name. From inside Docker, a service running on the host usually requires `host.docker.internal`; container-local `localhost` points to the container itself.

**3. Elasticsearch fails to start or is terminated.**  
Allocate sufficient memory to Docker. Linux hosts commonly require `vm.max_map_count=262144`. Inspect the Compose service logs for the exact failure.

**4. The default login is rejected.**  
Check whether `db:seed` or `demo:seed` was executed; they use different default passwords. Rerunning a seed command resets the corresponding demo administrator password.

**5. Retrieval returns no results.**  
Confirm that ingestion completed, embeddings are 768-dimensional, the Elasticsearch index is available, and the user can access the target space and documents. Run `pnpm search:reindex` when an index rebuild is required.

**6. GraphRAG or memory is unavailable.**  
Check Neo4j and Mem0 connectivity. For local diagnosis, set `AGENT_ENABLE_GRAPH=false` or `AGENT_ENABLE_MEMORY=false`; the base retrieval path remains available.

### License

This repository currently contains no `LICENSE` file and therefore grants no permission to copy, modify, distribute, or use the software commercially. Before publishing it as open source, maintainers should add an explicit license such as Apache-2.0 or MIT and update this section. Third-party dependencies remain subject to their respective licenses.
