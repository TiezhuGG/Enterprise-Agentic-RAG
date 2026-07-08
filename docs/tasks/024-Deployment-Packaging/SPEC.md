# TASK-024 Deployment Packaging

## 目标

将 Enterprise Agentic RAG 项目打包为可部署形态，第一版支持单机 Docker Compose。

本任务要让后端、前端与基础设施服务可以通过统一的生产 Compose 文件启动，并具备环境变量模板、健康检查、数据库迁移入口和部署说明。

## 范围

新增或更新：

```text
apps/backend/Dockerfile
apps/backend/docker-entrypoint.sh
apps/frontend/Dockerfile
apps/frontend/nginx.conf 或 Next.js standalone 运行配置
docker/docker-compose.prod.yml
.env.production.example
README.md
```

如 Next.js 使用 Node runtime，则不需要 nginx。

## 禁止

- 不引入 Kubernetes。
- 不绑定云厂商。
- 不在镜像内写死数据库、Redis、MinIO、Neo4j 或模型服务配置。
- 不绕过已有 ConfigService 与 env schema。
- 不让 Controller、Service 或业务模块处理部署逻辑。
- 不在 Dockerfile 中复制本机 `.env`。

## 服务

生产 Compose 至少包含：

- `backend`
- `frontend`
- `postgres`
- `redis`
- `minio`
- `neo4j`

## 配置

生产环境通过 env 文件注入：

```text
docker compose --env-file .env.production -f docker/docker-compose.prod.yml up -d
```

必须提供 `.env.production.example`，覆盖：

- App
- Database
- Redis
- MinIO
- Neo4j
- JWT
- Embedding
- Reranker
- LLM
- Agent
- Memory
- Frontend API

## 数据库

后端容器启动时支持：

1. Prisma generate
2. Prisma migrate deploy
3. 可选 seed
4. 启动 NestJS

Seed 必须通过显式变量开启，默认不执行。

## 健康检查

Compose 应包含健康检查：

- backend 调用 `/health`
- frontend 调用前端 HTTP 端口
- postgres 使用 `pg_isready`
- redis 使用 `redis-cli ping`
- minio 使用 `/minio/health/live`
- neo4j 使用 HTTP 或 cypher-shell 可用性检查

## 验收标准

- 后端 Dockerfile 可构建。
- 前端 Dockerfile 可构建。
- production compose 可通过配置校验。
- backend 依赖健康状态再启动。
- README 包含部署步骤。
- 不新增业务层部署污染。

## 验证命令

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
docker compose --env-file .env.production.example -f docker/docker-compose.prod.yml config
```
