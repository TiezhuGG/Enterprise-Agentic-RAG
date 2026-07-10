# TASK-054：架构决策

## 决策 1：用 Node 脚本编排生产部署

使用 `scripts/deploy-prod.mjs` 而不是 Bash-only 脚本。

原因：

- 仓库开发环境包含 Windows 和 Linux。
- Node 已经是项目必需运行时。
- 可以统一处理参数、env 解析和 health wait。

## 决策 2：仍使用 Docker Compose

本阶段继续使用单机 Docker Compose，不引入 Kubernetes。

原因：

- MVP 目标是可部署可演示。
- Compose 足够覆盖 Postgres、Redis、MinIO、Neo4j、Elasticsearch、Backend、Frontend。
- 部署复杂度更低，面试讲解更聚焦。

## 决策 3：迁移和 seed 在 backend 容器内执行

生产部署脚本通过 `docker compose exec backend ...` 执行 DB migration、seed、provider smoke 和 demo seed。

后果：

- 使用容器内同一套依赖和 env。
- 服务器无需额外配置本机 `DATABASE_URL`。

## 决策 4：生产模板默认稳定演示路径

`.env.production.example` 默认：

```text
AGENT_ENABLE_GRAPH=false
AGENT_ENABLE_MEMORY=false
```

原因：

- 首次上线优先跑通 Upload -> Ingest -> Retrieval -> Agent Answer。
- Graph / Memory 可以在 provider 稳定后再打开。

## 决策 5：不自动删除真实数据

部署脚本只调用 `demo:seed --reset`，该 reset 只处理 demo 命名空间。

后果：

- 可重复演示。
- 不会清空生产业务数据。
