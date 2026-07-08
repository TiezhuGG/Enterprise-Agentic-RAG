# TASK-024 Review Checklist

## 实现前

- [x] 已确认当前只有基础设施 compose。
- [x] 已确认 backend 使用 NestJS 与 Prisma。
- [x] 已确认 frontend 使用 Next.js。
- [x] 已确认 env schema 已覆盖主要运行配置。
- [x] 已确认已有 `/health` 可作为 backend healthcheck。

## 实现中

- [x] 新增 backend Dockerfile。
- [x] 新增 backend entrypoint。
- [x] 新增 frontend Dockerfile。
- [x] 新增 production compose。
- [x] 新增 `.env.production.example`。
- [x] 更新 README 部署章节。
- [x] 添加 root 部署脚本。

## 架构检查

- [x] Docker 配置没有进入业务模块。
- [x] 镜像没有复制 `.env`。
- [x] 生产配置通过 env file 注入。
- [x] migration 使用 `migrate deploy`。
- [x] seed 默认关闭。
- [x] healthcheck 不依赖私有业务接口。

## 验证后

- [x] `pnpm format:check` 通过。
- [x] `pnpm lint` 通过。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `docker compose --env-file .env.production.example -f docker/docker-compose.prod.yml config` 通过。

## 风险

- Next.js standalone 输出依赖 `output: 'standalone'`。
- Docker 构建需要网络下载基础镜像与依赖。
- 示例 env 中的密钥必须在真实生产环境替换。
- 外部 LLM、Embedding、Reranker、Mem0 服务不由本 Compose 启动。
