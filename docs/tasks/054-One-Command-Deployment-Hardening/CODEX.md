# TASK-054：Codex Prompt

你是 Enterprise Agentic RAG 项目的部署工程师。

请实现 One-Command Deployment Hardening。

## 必须遵守

- 先读本任务的 `SPEC.md`、`SEQUENCE.md`、`ADR.md`、`REVIEW.md`。
- 不改业务架构。
- 不在 Controller / Service 中写部署逻辑。
- 不输出 secret、prompt、answer、document content。
- 不删除生产真实数据。

## 实现目标

新增：

```bash
pnpm deploy:prod
pnpm deploy:prod:dry-run
pnpm deploy:prod:smoke
```

`deploy:prod` 应完成：

- env preflight
- docker compose config
- docker compose build
- docker compose up
- health wait
- prisma deploy
- db seed
- provider smoke
- demo seed

## 验证

必须执行：

```bash
node scripts/deploy-prod.mjs --help
node scripts/deploy-prod.mjs --env .env.production.example --dry-run --allow-placeholders
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
