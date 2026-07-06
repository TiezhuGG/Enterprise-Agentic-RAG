# Enterprise Agentic RAG

Enterprise Agentic RAG 是一个面向企业级 Agentic RAG 系统的 monorepo 工程骨架。

当前任务已完成工程初始化、统一配置系统、Prisma 数据库访问层和 JWT 认证系统，不包含 AI 能力或业务接口实现。

## 目录结构

```text
enterprise-agentic-rag/
├─ apps/
│  ├─ backend/
│  │  ├─ prisma/
│  │  │  ├─ migrations/
│  │  │  │  └─ 20260707003000_init/
│  │  │  │     └─ migration.sql
│  │  │  └─ schema.prisma
│  │  ├─ prisma.config.ts
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
│  │     │  └─ prisma/
│  │     │     ├─ prisma.client.ts
│  │     │     ├─ prisma.module.ts
│  │     │     ├─ prisma.service.ts
│  │     │     └─ seed.ts
│  │     ├─ modules/
│  │     │  ├─ auth/
│  │     │  │  ├─ decorators/
│  │     │  │  │  └─ current-user.decorator.ts
│  │     │  │  ├─ dto/
│  │     │  │  │  └─ login.dto.ts
│  │     │  │  ├─ guards/
│  │     │  │  │  └─ jwt-auth.guard.ts
│  │     │  │  ├─ strategies/
│  │     │  │  │  └─ jwt.strategy.ts
│  │     │  │  ├─ auth.controller.ts
│  │     │  │  ├─ auth.module.ts
│  │     │  │  ├─ auth.repository.ts
│  │     │  │  ├─ auth.service.ts
│  │     │  │  └─ auth.types.ts
│  │     │  └─ user/
│  │     │     ├─ user.module.ts
│  │     │     └─ user.repository.ts
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
- Database: Prisma, PostgreSQL
- 工程规范: ESLint, Prettier, EditorConfig, Husky, lint-staged, Commitlint
- 本地基础设施: Postgres, Redis, MinIO

## 配置系统

后端配置集中在 `apps/backend/src/config`：

- `env.schema.ts` 使用 zod 校验启动所需环境变量，校验失败会阻止 Nest 应用启动。
- `configuration.ts` 负责从本地 `.env` 或运行时环境读取变量，并组装 app、database、redis、minio 配置。
- `ConfigModule` 是全局 Nest module，`AppModule` 统一引入。
- `ConfigService` 提供 `get()`、`getAppConfig()`、`getDatabaseConfig()`、`getRedisConfig()`、`getMinioConfig()`、`getJwtConfig()`，业务代码必须通过它访问配置。

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
JWT_SECRET=non-empty string, at least 32 characters
JWT_EXPIRES_IN=non-empty string
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

## 数据库访问层

数据库访问遵循固定调用链：

```text
Service -> Repository -> PrismaService -> Prisma Client -> DB
```

Prisma 运行时代码只允许存在于 `apps/backend/src/infrastructure/prisma`。业务模块只能注入 Repository；Service、Controller、AI 层都不能直接访问 Prisma 或数据库。

### Prisma Schema

Prisma schema 位于 `apps/backend/prisma/schema.prisma`，包含以下模型：

```text
User
Role
Permission
UserRole
RolePermission
```

初始 migration 位于 `apps/backend/prisma/migrations/20260707003000_init/migration.sql`。

### 数据库设计

- `User` 存储用户基础身份信息，`email` 唯一。
- `Role` 存储角色，`code` 唯一，`isSystem` 标记系统内置角色。
- `Permission` 存储权限点，`code` 唯一。
- `UserRole` 是用户与角色的显式多对多关系表。
- `RolePermission` 是角色与权限的显式多对多关系表。

### Repository 示例

`UserRepository` 暴露用户查询、upsert 和角色绑定：

```ts
const user = await userRepository.findByEmail('admin@example.com');
await userRepository.assignRole(user.id, 'admin');
```

`AuthRepository` 暴露认证授权所需的数据访问：

```ts
const credentials = await authRepository.findUserCredentialsByEmail('admin@example.com');
await authRepository.attachPermissionToRole('admin', 'role.manage');
```

## 认证系统

认证模块位于 `apps/backend/src/modules/auth`，提供：

- `POST /auth/login`
- `GET /auth/me`
- `JwtAuthGuard`
- `@CurrentUser()` decorator

登录流程：

```text
email + password
-> AuthController
-> AuthService
-> UserRepository
-> bcrypt compare
-> JwtService sign
-> return bearer token
```

Controller 只接收请求并调用 service；JWT 签发在 `AuthService`；token 解析和 payload validation 在 `JwtStrategy`；Guard 只负责触发 Passport JWT 验证。

JWT payload：

```json
{
  "sub": "user id",
  "email": "user@example.com",
  "roles": ["admin"]
}
```

Guard 使用方式：

```ts
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: AuthenticatedUser) {
  return user;
}
```

seed 后可用本地管理员账号验证登录：

```text
email: admin@example.com
password: Admin123!
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

执行 Prisma migration：

```bash
pnpm db:migrate
```

执行 seed：

```bash
pnpm db:seed
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

常用数据库命令：

```bash
pnpm db:validate
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:seed
```

## 开发规范

- 统一使用 pnpm，不使用 npm 或 yarn。
- 提交信息遵循 Conventional Commits。
- 提交前通过 Husky 执行 lint-staged。
- 使用 ESLint 检查代码质量。
- 使用 Prettier 统一格式化。
- 新增业务代码前，应先完成对应模块边界、配置约定和测试策略设计。

## 当前边界

本工程当前包含项目骨架、开发工具链配置、本地基础设施编排、统一配置系统、Prisma 数据库访问层和 JWT 认证系统。

以下内容尚未实现：

- AI 或 RAG 能力
- 后端业务接口
- 前端页面
