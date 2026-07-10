# TASK-054：One-Command Deployment Hardening

## 目标

让一台新服务器 clone 仓库后，可以按固定命令完成生产演示部署：

```bash
cp .env.production.example .env.production
# 编辑 .env.production
pnpm install
pnpm deploy:prod
```

本任务聚焦部署可重复性、启动顺序、健康检查、迁移、seed、provider smoke 和 demo seed 闭环。

## 范围

- 新增生产部署编排脚本。
- 新增 root npm scripts。
- 完善 `.env.production.example` 的稳定演示默认值。
- 更新 README 和 demo 部署文档。
- 保留 Docker Compose 单机部署形态。

## 禁止项

- 不上 Kubernetes。
- 不绑定云厂商。
- 不在业务模块中写部署逻辑。
- 不让 Controller / Service 处理部署。
- 不输出 secret、API key、prompt、answer、document content。
- 不删除生产数据。

## 新命令

```bash
pnpm deploy:prod
pnpm deploy:prod:dry-run
pnpm deploy:prod:smoke
```

支持参数：

```bash
pnpm deploy:prod -- --skip-build
pnpm deploy:prod -- --skip-demo
pnpm deploy:prod -- --graph
pnpm deploy:prod -- --env .env.production
```

## 部署步骤

`deploy:prod` 执行：

1. 检查 `.env.production` 是否存在。
2. 检查关键 env 是否缺失或仍是 `change-me-*`。
3. 执行 `docker compose config`。
4. 构建镜像。
5. 启动生产 compose。
6. 等待 backend/frontend health。
7. 在 backend 容器中执行 migration。
8. 在 backend 容器中执行 seed。
9. 在 backend 容器中执行 provider smoke。
10. 在 backend 容器中执行 demo seed。

## 验收标准

- `pnpm deploy:prod:dry-run` 可展示部署步骤。
- `.env.production.example` 默认适合稳定 MVP 演示。
- README 包含一键部署说明。
- 部署脚本不打印 secret。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
