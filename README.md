# Enterprise Agentic RAG

Enterprise Agentic RAG 是面向企业级 Agentic RAG 系统的 monorepo 工程骨架。

当前已完成：

- TASK-001 Monorepo 结构初始化
- TASK-002 统一配置系统与环境策略
- TASK-003 Prisma 与数据库访问层
- TASK-004 JWT 认证系统
- TASK-005 面向知识检索的轻量 RBAC
- TASK-006 Enterprise Knowledge Space
- TASK-007 Knowledge Document Domain
- TASK-008 Object Storage Layer

当前边界：已实现 Knowledge Space、Document 元数据领域与统一对象存储基础设施；尚未实现文件上传、Multipart 上传、Document 绑定文件、Parser、OCR、Chunk、Embedding、Vector Database、Graph、Memory 或 AI/RAG 检索能力。

## 目录结构

```text
enterprise-agentic-rag/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   │   ├── 20260707003000_init/
│   │   │   │   ├── 20260707020500_add_knowledge_spaces/
│   │   │   │   └── 20260707043000_add_documents/
│   │   │   └── schema.prisma
│   │   ├── prisma.config.ts
│   │   └── src/
│   │       ├── common/
│   │       │   └── request-context/
│   │       │       ├── execution-context.ts
│   │       │       ├── request-context.module.ts
│   │       │       └── request-context.service.ts
│   │       ├── config/
│   │       ├── infrastructure/
│   │       │   ├── prisma/
│   │       │   │   ├── prisma.client.ts
│   │       │   │   ├── prisma.module.ts
│   │       │   │   ├── prisma.service.ts
│   │       │   │   └── seed.ts
│   │       │   └── storage/
│   │       │       ├── index.ts
│   │       │       ├── storage.client.ts
│   │       │       ├── storage.module.ts
│   │       │       ├── storage.service.ts
│   │       │       └── storage.types.ts
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── document/
│   │       │   │   ├── dto/
│   │       │   │   │   ├── create-document.dto.ts
│   │       │   │   │   └── update-document.dto.ts
│   │       │   │   ├── entities/
│   │       │   │   │   └── document.entity.ts
│   │       │   │   ├── document.controller.ts
│   │       │   │   ├── document.module.ts
│   │       │   │   ├── document.repository.ts
│   │       │   │   ├── document.service.ts
│   │       │   │   └── index.ts
│   │       │   ├── knowledge-space/
│   │       │   └── user/
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── frontend/
│       ├── lib/
│       │   ├── env.ts
│       │   └── load-local-env.ts
│       ├── next.config.ts
│       └── package.json
├── docker/
│   └── docker-compose.yml
├── packages/
│   ├── sdk/
│   └── shared/
├── .env.example
└── README.md
```

## 架构边界

后端数据库访问固定链路：

```text
Controller -> Service -> Repository -> PrismaService -> Prisma Client -> DB
```

约束：

- Prisma 只存在于 `apps/backend/src/infrastructure/prisma`。
- Service 不能直接访问 Prisma。
- Controller 不写业务逻辑。
- Guard 只做认证或权限判断，不访问 Repository。
- 所有环境变量必须通过后端 `ConfigService` 或前端 `lib/env.ts` 访问。
- Document 不是 File；当前只实现文档领域元数据，不实现上传、解析、向量化或对象存储。
- 业务模块只能依赖 `StorageService`，不能直接依赖 MinIO SDK。

## 配置系统

后端配置集中在 `apps/backend/src/config`：

- `env.schema.ts` 使用 zod 校验启动必需环境变量，校验失败会阻止启动。
- `configuration.ts` 组装 app、database、redis、minio、jwt 配置。
- `ConfigService` 暴露 `get()`、`getAppConfig()`、`getDatabaseConfig()`、`getRedisConfig()`、`getMinioConfig()`、`getJwtConfig()`。

前端配置集中在 `apps/frontend/lib/env.ts`：

- `apiBaseUrl` 来自 `NEXT_PUBLIC_API_BASE_URL`。
- `runtimeConfig` 暴露 `APP_ENV` 与生产环境判断。

必需环境变量：

```text
APP_ENV
APP_PORT
DATABASE_URL
REDIS_URL
MINIO_ENDPOINT
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET
JWT_SECRET
JWT_EXPIRES_IN
NEXT_PUBLIC_API_BASE_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```

## 数据库设计

Prisma schema 位于 `apps/backend/prisma/schema.prisma`。

已实现模型：

```text
User
Role
Permission
UserRole
RolePermission
KnowledgeSpace
SpaceMember
Document
```

Knowledge Space 是后续 RAG 体系的根聚合。

```text
KnowledgeSpace
- id
- name
- description
- visibility: PRIVATE | INTERNAL | PUBLIC
- status: ACTIVE | ARCHIVED | DELETED
- ownerId
- createdAt
- updatedAt

SpaceMember
- spaceId
- userId
- role: OWNER | EDITOR | VIEWER
```

Document 是 KnowledgeSpace 下一级核心知识实体，但不是文件上传对象。

```text
Document
- id
- spaceId
- title
- description
- type: PDF | WORD | TXT | MARKDOWN | IMAGE | AUDIO | VIDEO
- status: CREATED | PROCESSING | READY | FAILED | ARCHIVED
- storageKey?
- mimeType?
- size?
- createdBy
- createdAt
- updatedAt
```

关系：

- `KnowledgeSpace.ownerId -> User.id`
- `SpaceMember.spaceId -> KnowledgeSpace.id`
- `SpaceMember.userId -> User.id`
- `Document.spaceId -> KnowledgeSpace.id`
- `Document.createdBy -> User.id`
- `SpaceMember` 使用 `(spaceId, userId)` 作为联合主键。
- 删除 Space 当前采用软删除，写入 `status = DELETED`。
- 删除 Document 当前采用软删除，写入 `status = ARCHIVED`。

迁移：

```text
apps/backend/prisma/migrations/20260707003000_init/migration.sql
apps/backend/prisma/migrations/20260707020500_add_knowledge_spaces/migration.sql
apps/backend/prisma/migrations/20260707043000_add_documents/migration.sql
```

## Authentication 与 RBAC

认证模块位于 `apps/backend/src/modules/auth`。

API：

```text
POST /auth/login
GET /auth/me
GET /auth/context
```

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

JWT payload：

```json
{
  "sub": "user id",
  "email": "user@example.com",
  "roles": ["admin"],
  "permissions": ["user.read"],
  "spaceIds": ["space id"],
  "metadata": {}
}
```

轻量 RBAC 面向知识检索授权，不表示后台菜单权限：

- `@Roles()`
- `@Permissions()`
- `RolesGuard`
- `PermissionsGuard`

## ExecutionContext

TASK-005 的 `KnowledgeRequestContext` 已升级为通用 `ExecutionContext`，后续所有 AI 模块统一使用它。

```ts
interface ExecutionContext {
  userId: string;
  roles: string[];
  permissions: string[];
  spaceIds: string[];
  tenantId?: string;
  departmentId?: string;
  metadata: Record<string, unknown>;
}
```

`RequestContextService` 负责从认证用户创建 `ExecutionContext`。当前 HTTP controller 通过 `@CurrentUser()` 获取用户，再交给 `RequestContextService` 生成上下文。

## Knowledge Space API

所有 `/spaces` API 都需要 `JwtAuthGuard`。

```text
POST   /spaces
GET    /spaces
GET    /spaces/:id
PATCH  /spaces/:id
DELETE /spaces/:id
```

行为：

- `POST /spaces` 创建 Knowledge Space，并自动写入创建者的 `SpaceMember OWNER`。
- `GET /spaces` 只返回当前用户加入且未删除的 Space。
- `GET /spaces/:id` 只允许成员访问未删除的 Space。
- `PATCH /spaces/:id` 允许 `OWNER`、`EDITOR` 更新基础信息；写入 `DELETED` 需要 `OWNER`。
- `DELETE /spaces/:id` 只允许 `OWNER`，并软删除为 `DELETED`。

## Document API

所有 Document API 都需要 `JwtAuthGuard`，权限判断基于 `ExecutionContext` 与 Space 成员关系。

```text
POST   /spaces/:spaceId/documents
GET    /spaces/:spaceId/documents
GET    /documents/:id
PATCH  /documents/:id
DELETE /documents/:id
```

权限：

```text
create: OWNER | EDITOR
read:   OWNER | EDITOR | VIEWER
update: OWNER | EDITOR
delete: OWNER
```

行为：

- `POST /spaces/:spaceId/documents` 在指定 Space 下创建 Document 元数据，初始状态为 `CREATED`。
- `GET /spaces/:spaceId/documents` 查询 Space 下未归档 Document。
- `GET /documents/:id` 查询未归档 Document 详情，并验证当前用户具备对应 Space 读取权限。
- `PATCH /documents/:id` 更新 Document 元数据；写入 `ARCHIVED` 需要 `OWNER`。
- `DELETE /documents/:id` 将 Document 软删除为 `ARCHIVED`。

示例：

```bash
curl -X POST http://localhost:3000/spaces/<spaceId>/documents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"RAG Architecture","type":"MARKDOWN","description":"Architecture notes"}'
```

## Document 生命周期

```text
CREATED
-> PROCESSING
-> READY
-> FAILED
-> ARCHIVED
```

当前只建立生命周期字段，不实现 Parser、OCR、Chunk、Embedding 或异步处理流程。后续处理器可以在获得 Space 授权后推进 `PROCESSING`、`READY`、`FAILED` 状态。

## Object Storage

对象存储基础设施位于 `apps/backend/src/infrastructure/storage`，使用 MinIO npm package 封装统一对象存储能力。

```text
Business Module
-> StorageService
-> StorageClient
-> MinIO Client
```

公开服务：

```ts
uploadObject(key, buffer, contentType);
getObject(key);
deleteObject(key);
exists(key);
```

设计约束：

- `StorageClient` 负责 MinIO SDK 初始化、endpoint 解析和 bucket 自动创建。
- `StorageService` 负责向业务层暴露稳定方法。
- MinIO 配置来自 `ConfigService.getMinioConfig()`。
- 不允许业务模块直接引入 `minio` package。
- 当前没有 Upload Controller、Multipart 上传、Document 绑定文件或 Parser。

MinIO 配置：

```text
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=enterprise-agentic-rag
```

基础验证：

```text
1. 创建 Nest application context 并加载 StorageModule
2. StorageClient 初始化时连接 MinIO
3. bucket 不存在时自动创建
4. uploadObject 写入测试对象
5. getObject 读取测试对象
6. deleteObject 删除测试对象
7. exists 确认对象删除后不存在
```

## Space 如何成为 Aggregate Root

Knowledge Space 是 Document、Chunk、Embedding、Graph、Memory 的归属边界。

当前 Document 挂载方式：

```text
Document.spaceId -> KnowledgeSpace.id
```

后续子资源挂载方式应为：

```text
Chunk.documentId -> Document.id
Embedding.chunkId -> Chunk.id
Graph.spaceId -> KnowledgeSpace.id
Memory.spaceId -> KnowledgeSpace.id
```

聚合根约束：

- 所有 Knowledge 子资源必须带 `spaceId` 或可追溯到 `spaceId`。
- 子资源访问必须先校验用户是否为 Space 成员。
- 检索过滤必须从 `ExecutionContext.spaceIds` 与 Space 成员关系出发。
- Document、Chunk、Embedding、Graph、Memory 的 Repository 不应绕过 Space 边界查询数据。
- AI 模块只接收 `ExecutionContext` 和已授权的 Space 范围，不直接访问数据库。

## 后续如何接入 MinIO

后续接入 MinIO 时应保持 Document 与 File 的边界：

- Upload 模块负责接收文件与写入对象存储。
- MinIO 返回的 object key 写入 `Document.storageKey`。
- `mimeType`、`size` 可以来自上传层校验后的文件元数据。
- Parser 从 Document 读取 `storageKey`，但解析结果必须继续挂载在同一个 `spaceId` 下。
- Document Repository 仍只处理数据库元数据，不直接调用 MinIO SDK。
- Document Service 后续只依赖 `StorageService` 或更上层应用服务，不直接依赖 MinIO Client。

## 启动方式

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

执行迁移：

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

常用检查：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

seed 管理员账号：

```text
email: admin@example.com
password: Admin123!
```
