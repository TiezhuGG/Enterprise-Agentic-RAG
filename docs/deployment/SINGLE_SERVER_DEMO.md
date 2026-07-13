# 单服务器演示环境部署

本方案面向 4 核 8GB Ubuntu 22.04/24.04 服务器。服务器负责应用、数据组件和 embedding；LLM 与 reranker 使用外部 OpenAI-compatible API。

## 1. 安全组与服务器

云服务器安全组只开放：

- `22/tcp`：SSH 密钥登录。
- `80/tcp`：初期仅允许你的固定公网 IP。

不要开放 `3000`、`3001`、`5432`、`6379`、`7474`、`7687`、`9000`、`9200` 或 `11434`。

安装基础工具和 Docker：

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl fail2ban git
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sudo sh /tmp/get-docker.sh
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker fail2ban
```

重新登录 SSH，使 docker 用户组生效。创建 4GB swap：

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

确认 `/etc/ssh/sshd_config` 至少包含：

```text
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
```

修改后执行 `sudo systemctl reload ssh`。在关闭当前 SSH 会话前，务必用另一个终端验证密钥登录。

## 2. 初始化项目目录

```bash
sudo mkdir -p /opt/enterprise-rag /opt/enterprise-rag-backups
sudo chown -R "$USER":"$USER" /opt/enterprise-rag /opt/enterprise-rag-backups
git clone https://github.com/OWNER/REPOSITORY.git /opt/enterprise-rag
cd /opt/enterprise-rag
cp .env.demo.example .env.production
chmod 600 .env.production
```

编辑 `.env.production`：

- 将 `CHANGE_ME_SERVER_IP` 替换为服务器公网 IP。
- 将 `GHCR_IMAGE_PREFIX` 设置为 `ghcr.io/owner/repository`，必须全小写。
- 为 PostgreSQL、Elasticsearch、MinIO、Neo4j 和 JWT 生成独立随机密码。
- 配置真实的 LLM 与 reranker 地址、密钥和模型名。
- 数据库密码如包含 URL 特殊字符，必须在 `DATABASE_URL` 中进行 URL 编码。
- 不要将 `.env.production` 提交到 GitHub。

推荐生成随机值：

```bash
openssl rand -hex 32
```

## 3. GitHub 配置

在仓库 `Settings -> Actions -> General` 中允许 Actions 读取代码和写入 Packages。

Repository Variables：

```text
GHCR_IMAGE_PREFIX=ghcr.io/owner/repository
PUBLIC_API_BASE_URL=/api
DEPLOY_PLATFORM=linux/amd64
```

Repository Secrets：

```text
SERVER_HOST=服务器公网IP
SERVER_PORT=22
SERVER_USER=deploy
SERVER_SSH_KEY=deploy用户的私钥全文
```

第一次手动运行 `Build and Deploy Demo` 时，将 `deploy` 选为 `false`，只构建镜像。完成后在 GitHub Packages 中将 backend 和 frontend 两个容器包设置为 Public。公开包不需要服务器保存 GHCR Token。

服务器上的仓库 remote 必须是公开 HTTPS 地址，并保证 `deploy` 用户可以运行 Docker。

## 4. 首次部署

先在 GitHub Actions 手动运行 `Build and Deploy Demo` 并将 `deploy=false`，生成 `latest` 镜像。首次服务器初始化执行：

```bash
cd /opt/enterprise-rag
bash scripts/server-first-run.sh --seed
```

如需演示样例数据：

```bash
bash scripts/server-first-run.sh --seed --demo
```

脚本会：

1. 拉取 GHCR 和基础设施镜像。
2. 启动 PostgreSQL、Redis、Elasticsearch、MinIO、Neo4j 和 Ollama。
3. 下载 `nomic-embed-text`。
4. 启动 Backend、Worker、Frontend 和 Caddy。
5. 执行 Prisma migration，并按参数创建初始数据。

访问地址：

```text
http://服务器IP
http://服务器IP/api/health
http://服务器IP/api/health/readiness
```

只在云安全组允许的来源 IP 中访问。HTTP 阶段不要上传真实敏感资料。

## 5. 自动部署与回滚

提交到 `main` 后，GitHub Actions 会执行质量检查、构建两个镜像并调用：

```bash
bash scripts/deploy-server.sh <commit-sha>
```

服务器将当前成功 SHA 保存在 `/opt/enterprise-rag/.current-image-tag`。新版本健康检查失败时，脚本自动恢复上一个 SHA。

手动部署指定版本：

```bash
cd /opt/enterprise-rag
git pull --ff-only origin main
bash scripts/deploy-server.sh COMMIT_SHA
```

> 回滚只恢复应用镜像，不会回滚已经执行的数据库 migration。发布新的 schema 前，应保持至少一个版本的向后兼容；涉及删除字段或不可逆数据转换时，先完成数据迁移与备份，再在后续版本移除旧逻辑。

查看状态与日志：

```bash
docker compose --env-file .env.production -f docker/docker-compose.demo.yml ps
docker compose --env-file .env.production -f docker/docker-compose.demo.yml logs --tail=200 backend ingestion-worker
bash scripts/server-health-check.sh
```

## 6. 备份与 cron

每日 PostgreSQL 与 MinIO 备份：

```bash
bash /opt/enterprise-rag/scripts/server-backup.sh
```

每周包含 Neo4j 冷备份：

```bash
bash /opt/enterprise-rag/scripts/server-backup.sh --include-neo4j
```

示例 cron：

```cron
15 3 * * * bash /opt/enterprise-rag/scripts/server-backup.sh >> /var/log/enterprise-rag-backup.log 2>&1
45 3 * * 0 bash /opt/enterprise-rag/scripts/server-backup.sh --include-neo4j >> /var/log/enterprise-rag-neo4j-backup.log 2>&1
*/10 * * * * bash /opt/enterprise-rag/scripts/server-health-check.sh >> /var/log/enterprise-rag-health.log 2>&1
```

默认备份保留 7 天。`.env.production` 需要单独进行加密离线备份。

## 7. 域名与 HTTPS

取得域名后，将 `docker/Caddyfile.demo` 第一行从 `:80` 改为域名，例如：

```caddyfile
kb.example.com {
```

然后：

1. 将域名 A 记录指向服务器 IP。
2. 安全组开放 `80/443`，Compose 为 Caddy 增加 `443:443`。
3. 将 `.env.production` 的 `CORS_ORIGINS` 改为 `https://kb.example.com`。
4. 重启 backend 和 Caddy。

前端使用 `/api` 相对路径，因此切换域名时不需要重新构建 frontend。
