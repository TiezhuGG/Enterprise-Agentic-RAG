# Enterprise Agentic RAG

Enterprise Agentic RAG 是一个面向企业级 Agentic RAG 系统的 monorepo 工程骨架。

当前任务已完成工程初始化和统一配置系统，不包含登录、数据库访问、AI 能力、业务模块或任何业务接口实现。

## 目录结构

```text
enterprise-agentic-rag/
├─ apps/
│  ├─ backend/
│  │  └─ src/
│  │     ├─ common/
│  │     ├─ config/
│  │     │  ├─ config.module.ts
│  │     │  ├─ config.service.ts
│  │     │  ├─ config.types.ts
│  │     │  ├─ configuration.ts
│  │     │  ├─ env.schema.ts
│  │     │  └─ index.ts
│  │     ├─ infrastructure/
│  │     ├─ modules/
│  │     ├─ app.module.ts
│  │     └─ main.ts
│  └─ frontend/
│     ├─ app/
│     ├─ components/
│     ├─ hooks/
│     ├─ lib/
│     │  └─ env.ts
│     ├─ services/
│     ├─ store/
│     └─ types/
├─ packages/
│  ├─ shared/
│  └─ sdk/
├─ docker/
│  └─ docker-compose.yml
├─ docs/
├─ scripts/
├─ .env.example
├─ .github/
└─ .husky/
```

## 技术栈

- Monorepo: pnpm workspace
- Backend: NestJS
- Frontend: Next.js App Router
- 工程规范: ESLint, Prettier, EditorConfig, Husky, lint-staged, Commitlint
- 本地基础设施: Postgres, Redis, MinIO

## 配置系统

后端配置集中在 `apps/backend/src/config`：

- `env.schema.ts` 使用 zod 校验启动所需环境变量，校验失败会阻止 Nest 应用启动。
- `configuration.ts` 负责从本地 `.env` 或运行时环境读取变量，并组装 app、database、redis、minio 配置。
- `ConfigModule` 是全局 Nest module，`AppModule` 统一引入。
- `ConfigService` 提供 `get()`、`getAppConfig()`、`getDatabaseConfig()`、`getRedisConfig()`、`getMinioConfig()`，业务代码必须通过它访问配置。

前端配置集中在 `apps/frontend/lib/env.ts`：

- `apiBaseUrl` 来自 `NEXT_PUBLIC_API_BASE_URL`。
- `runtimeConfig` 暴露 `APP_ENV` 和生产环境判断。
- `next.config.ts` 只从 `env.ts` 读取配置，不在业务代码中直接读取环境变量。

禁止在业务代码中直接访问环境变量。新增配置项时，先扩展 schema，再通过 config service 或 `env.ts` 暴露。

### Env Schema

后端启动必需变量：

```text
APP_ENV=local | development | test | staging | production
APP_PORT=1..65535
DATABASE_URL=valid URL
REDIS_URL=valid URL
MINIO_ENDPOINT=valid URL
MINIO_ACCESS_KEY=non-empty string
MINIO_SECRET_KEY=non-empty string
MINIO_BUCKET=non-empty string
```

前端必需变量：

```text
APP_ENV=local | development | test | staging | production
NEXT_PUBLIC_API_BASE_URL=absolute URL or root-relative path
```

Docker 基础设施变量：

```text
POSTGRES_DB=non-empty string
POSTGRES_USER=non-empty string
POSTGRES_PASSWORD=non-empty string
MINIO_ACCESS_KEY=non-empty string
MINIO_SECRET_KEY=non-empty string
```

## 启动

安装依赖：

```bash
pnpm install
```

准备环境变量：

```bash
cp .env.example .env
```

启动基础设施：

```bash
pnpm docker:up
```

启动后端：

```bash
pnpm dev:backend
```

启动前端：

```bash
pnpm dev:frontend
```

同时启动前后端：

```bash
pnpm dev
```

关闭基础设施：

```bash
pnpm docker:down
```

Docker Compose 通过 `--env-file .env` 和 `env_file` 注入环境变量。缺少必需变量时，Compose 或后端 zod 校验会直接失败。

## 开发规范

- 统一使用 pnpm，不使用 npm 或 yarn。
- 提交信息遵循 Conventional Commits。
- 提交前通过 Husky 执行 lint-staged。
- 使用 ESLint 检查代码质量。
- 使用 Prettier 统一格式化。
- 新增业务代码前，应先完成对应模块边界、配置约定和测试策略设计。

## 当前边界

本工程当前包含项目骨架、开发工具链配置、本地基础设施编排和统一配置系统。

以下内容尚未实现：

- 登录
- 数据库访问层
- AI 或 RAG 能力
- 后端业务接口
- 前端页面
