# TASK-024 Codex Prompt

你是 Enterprise Agentic RAG 项目的后端与部署工程师。

请严格遵守当前 DDD 架构与 monorepo 结构，完成 Deployment Packaging。

## 必须先阅读

```text
docs/tasks/024-Deployment-Packaging/SPEC.md
docs/tasks/024-Deployment-Packaging/SEQUENCE.md
docs/tasks/024-Deployment-Packaging/ADR.md
docs/tasks/024-Deployment-Packaging/REVIEW.md
docs/tasks/024-Deployment-Packaging/CODEX.md
```

## 目标

将项目打包为可部署形态，支持单机 Docker Compose 启动：

- backend
- frontend
- postgres
- redis
- minio
- neo4j

## 必须实现

1. backend Dockerfile
2. backend docker entrypoint
3. frontend Dockerfile
4. production docker compose
5. `.env.production.example`
6. README deployment section
7. root package scripts

## 禁止

- 不引入 Kubernetes。
- 不绑定云厂商。
- 不把 `.env` 复制进镜像。
- 不在业务代码中写部署逻辑。
- 不绕过已有 ConfigService。
- 不把数据库、Redis、MinIO、Neo4j、模型服务配置写死在代码中。

## Backend 要求

启动顺序：

```text
prisma generate
↓
prisma migrate deploy
↓
可选 seed
↓
node dist/main.js
```

Seed 只能通过 `RUN_SEED=true` 开启。

## Frontend 要求

使用 Next.js production runtime。

优先使用 standalone 输出，避免运行完整开发依赖。

## Compose 要求

必须支持：

```text
docker compose --env-file .env.production -f docker/docker-compose.prod.yml up -d
```

必须包含 healthcheck 与服务依赖。

## 验证

执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
docker compose --env-file .env.production.example -f docker/docker-compose.prod.yml config
```

## 输出

完成后输出：

- 修改文件列表
- 新增目录/文件
- 部署方式
- 环境变量说明
- 验证结果
- 后续建议
