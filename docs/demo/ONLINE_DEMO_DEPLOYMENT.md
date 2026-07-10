# 线上演示部署说明

本项目的线上演示推荐使用一台 Linux 云服务器和 Docker Compose。生产编排文件已经在 `docker/docker-compose.prod.yml` 中维护。

## 部署前检查

- 服务器已安装 Docker、Docker Compose、Node.js 20+、pnpm。
- `.env.production` 从 `.env.production.example` 复制，并替换所有 `change-me-*`。
- `NEXT_PUBLIC_API_BASE_URL` 必须是浏览器可访问的后端地址，例如 `http://your-server-ip:3000`。
- `CORS_ORIGINS` 必须包含前端访问地址，例如 `http://your-server-ip:3001`。
- `LLM_API_URL`、`EMBEDDING_API_URL`、`RERANKER_API_URL` 必须指向真实可访问的 OpenAI-compatible 服务。
- 不要在容器里使用 `localhost:11434` 指向宿主机模型服务；如果模型服务在宿主机，使用 `http://host.docker.internal:11434/...`。

## 推荐命令

```bash
cp .env.production.example .env.production
pnpm docker:prod:config
pnpm docker:prod:build
pnpm docker:prod:up
pnpm db:deploy
pnpm db:seed
pnpm provider:smoke
pnpm demo:seed
```

## 演示验收流程

1. 打开前端地址，未登录时进入 `/login`。
2. 登录后进入 `/console`，刷新页面不应闪回登录页。
3. 在顶部切换或创建知识空间。
4. 上传 txt 或 pdf 文档，点击开始解析。
5. 在文档中心预览和下载原文件。
6. 在搜索中心提问，查看按文档聚合的引用来源。
7. 在 AI 智能问答提问，查看回答下方和右侧的引用文档。
8. 如果解析时开启图谱抽取，到知识图谱页查看实体和关系。
9. 到系统管理检查服务健康状态和最近执行记录。

## 常见问题

- `/ingest` 报 `fetch failed ECONNREFUSED 127.0.0.1:11434`：模型服务地址不可达，修改 `EMBEDDING_API_URL`。
- 图谱为空：确认文档解析时开启了“抽取知识图谱”，并且 Neo4j readiness 正常。
- 前端能打开但接口失败：确认 `NEXT_PUBLIC_API_BASE_URL`、`CORS_ORIGINS` 和防火墙端口。
