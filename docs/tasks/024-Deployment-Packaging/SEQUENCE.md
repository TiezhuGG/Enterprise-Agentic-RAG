# TASK-024 Sequence

## 正常部署流程

```text
复制 .env.production.example 为 .env.production
↓
修改密钥、数据库密码、模型 API 地址
↓
docker compose --env-file .env.production -f docker/docker-compose.prod.yml build
↓
docker compose --env-file .env.production -f docker/docker-compose.prod.yml up -d
↓
基础设施健康检查通过
↓
backend entrypoint 执行 migrate deploy
↓
backend 启动 NestJS
↓
frontend 启动 Next.js
↓
访问前端与后端 health
```

## Backend 启动流程

```text
容器启动
↓
读取 env file 注入的环境变量
↓
pnpm prisma:generate
↓
pnpm prisma:deploy
↓
如 RUN_SEED=true，执行 pnpm prisma:seed
↓
node dist/main.js
```

## Frontend 启动流程

```text
容器启动
↓
读取 NEXT_PUBLIC_API_BASE_URL
↓
Next.js 监听 3001
↓
对外提供页面与静态资源
```

## 健康检查流程

```text
postgres healthy
redis healthy
minio healthy
neo4j healthy
↓
backend 开始启动
↓
backend /health healthy
↓
frontend 开始启动
↓
frontend HTTP healthy
```

## 错误流程

### Env 缺失

```text
backend 启动
↓
ConfigService 进行 zod 校验
↓
缺失必填 env
↓
进程退出
```

### Migration 失败

```text
backend entrypoint
↓
prisma migrate deploy
↓
失败
↓
容器退出
↓
Compose 标记服务异常
```

### 依赖服务不可用

```text
基础设施 healthcheck 失败
↓
backend 不进入 healthy
↓
frontend 继续等待或启动后无法调用 API
↓
通过 docker compose logs 定位
```

## 升级流程

```text
拉取新代码或新镜像
↓
docker compose build backend frontend
↓
docker compose up -d
↓
backend 自动执行 migrate deploy
↓
服务滚动替换为新容器
```
