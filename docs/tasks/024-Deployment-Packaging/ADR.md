# TASK-024 ADR

## 决策：先支持单机 Docker Compose

当前项目仍处于企业级 RAG 架构成型阶段，第一版部署应优先可复现、可本地验证、便于排障。

因此选择 Docker Compose 管理：

- backend
- frontend
- postgres
- redis
- minio
- neo4j

暂不引入 Kubernetes、Helm 或云厂商托管服务。

## 决策：镜像不包含 `.env`

配置必须由运行环境注入。镜像内只包含代码与构建产物。

这样可以避免密钥进入镜像层，也能让同一镜像在 dev、staging、production 中复用。

## 决策：Backend entrypoint 执行 migrate deploy

生产环境使用 Prisma 的 `migrate deploy`，而不是 `migrate dev`。

原因：

- `migrate deploy` 适合不可交互生产环境。
- 不会自动生成新的 migration。
- 与 CI/CD 和容器启动模型更匹配。

Seed 默认不执行，只允许通过 `RUN_SEED=true` 显式开启。

## 决策：Frontend 使用 Next.js standalone

前端使用 Next.js 的 standalone 输出，运行时只需要 Node.js 与 `.next/standalone`。

这样镜像比完整 workspace 更小，也不需要额外 nginx。后续如要接入统一反向代理，可以单独新增 gateway 或 nginx 服务。

## 决策：Compose healthcheck 做最低可用检查

本任务只实现服务级健康检查，不引入外部 APM。

业务级可观测性继续由 TASK-022 Observability 提供。

## 后果

收益：

- 项目可以通过一个 Compose 文件部署。
- 环境变量边界清晰。
- migration 与 seed 行为可控。
- 后续 Evaluation、Multimodal 和 CI/CD 可以复用该部署形态。

代价：

- 单机 Compose 不解决高可用。
- 不包含 TLS、域名、网关、自动扩缩容。
- 外部模型服务需要用户自行提供可访问地址。
