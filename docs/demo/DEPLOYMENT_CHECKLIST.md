# Deployment Checklist

## 环境变量

- [ ] `.env.production` 已从 `.env.production.example` 复制。
- [ ] `JWT_SECRET` 已替换为至少 32 字符的强随机字符串。
- [ ] PostgreSQL、Redis、MinIO、Neo4j、Elasticsearch 密码已替换。
- [ ] LLM / Embedding / Reranker endpoint、key、model 已配置。
- [ ] `NEXT_PUBLIC_API_BASE_URL` 指向外部可访问的 backend 地址。
- [ ] OCR / ASR / Video provider 使用 metadata fallback 或真实配置完整。

## 构建

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm docker:prod:config`
- [ ] `pnpm docker:prod:build`

## 数据库

- [ ] `pnpm db:validate`
- [ ] `pnpm db:deploy`
- [ ] `pnpm db:seed`
- [ ] 确认 admin 登录可用。

## 服务启动

- [ ] `pnpm docker:prod:up`
- [ ] `GET /health` 返回 `ok`。
- [ ] `GET /health/readiness` 返回 `ok` 或可解释的 `degraded`。
- [ ] `GET /metrics` 可访问。

## Demo 数据

- [ ] `pnpm demo:seed` 输出 `spaceId`、`documentId`、`conversationId`。
- [ ] `pnpm provider:smoke` 生成报告。
- [ ] 前端 Workbench 可登录。
- [ ] Pipeline Timeline 有事件。
- [ ] Agent Debug 有 token streaming、citation、trace。

## 安全

- [ ] 截图不包含 API key。
- [ ] 日志不包含完整 prompt、answer、document content。
- [ ] 生产环境不使用默认 MinIO/Postgres/Neo4j 密码。
- [ ] `.env.production` 不提交仓库。

## 回滚

- [ ] 保留上一版镜像 tag。
- [ ] 数据库迁移已备份。
- [ ] MinIO bucket 已确认备份策略。
- [ ] 记录 provider endpoint 变更。
