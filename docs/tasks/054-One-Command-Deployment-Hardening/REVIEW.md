# TASK-054：Review Checklist

## 实现前

- [ ] 阅读生产 Docker Compose。
- [ ] 阅读 backend/frontend Dockerfile。
- [ ] 阅读 `.env.production.example`。
- [ ] 阅读现有 README 部署说明。

## 实现后

- [ ] 新增 5 个任务文档。
- [ ] 新增生产部署脚本。
- [ ] 新增 `deploy:prod` 命令。
- [ ] 新增 `deploy:prod:dry-run` 命令。
- [ ] 新增 `deploy:prod:smoke` 命令。
- [ ] `.env.production.example` 默认稳定演示路径。
- [ ] README 更新一键部署命令。
- [ ] 部署文档更新。
- [ ] 脚本不打印 secret value。

## 验证

- [ ] `node scripts/deploy-prod.mjs --help`
- [ ] `node scripts/deploy-prod.mjs --env .env.production.example --dry-run --allow-placeholders`
- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`

## 可选服务器 Smoke

- [ ] `pnpm deploy:prod`
- [ ] 前端公网可访问。
- [ ] `/health` 返回 ok。
- [ ] `/health/readiness` 返回 ok 或可解释 degraded。
- [ ] demo Space 可问答。
