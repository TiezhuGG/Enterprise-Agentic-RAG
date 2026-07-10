# TASK-054：执行流程

## 正常部署流程

```text
读取参数
↓
读取 .env.production
↓
preflight 检查
↓
docker compose config
↓
docker compose build
↓
docker compose up -d
↓
等待 /health
↓
等待 frontend
↓
docker compose exec backend prisma:deploy
↓
docker compose exec backend prisma:seed
↓
docker compose exec backend provider:smoke
↓
docker compose exec backend demo:seed --reset --no-graph
↓
输出访问地址和下一步
```

## Dry Run 流程

```text
读取参数
↓
读取 env
↓
preflight
↓
只打印将要执行的命令
↓
退出
```

Dry Run 不启动 Docker，不写数据库。

## Smoke Only 流程

```text
读取 env
↓
等待 backend/frontend health
↓
provider smoke
↓
demo seed（可跳过）
```

用于服务器已经启动后的复查。

## 错误流程

- `.env.production` 不存在：提示复制模板。
- 必填 env 缺失：列出 key，不输出 value。
- 仍包含 `change-me`：阻止生产部署，除非显式 `--allow-placeholders`。
- health 超时：提示查看 `pnpm docker:prod:logs`。
- provider smoke 失败：脚本失败，但不输出 secret。
