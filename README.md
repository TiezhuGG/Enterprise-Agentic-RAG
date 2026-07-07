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
- TASK-009 Document Upload Pipeline

当前边界：已实现 Knowledge Space、Document 元数据、对象存储基础设施和 Document 上传编排；尚未实现 Parser、OCR、ASR、Chunk、Embedding、Vector Search、Graph、Memory 或 AI Agent。

## 目录结构

```text
enterprise-agentic-rag/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── common/
│   │       │   └── request-context/
│   │       ├── config/
│   │       ├── infrastructure/
│   │       │   ├── prisma/
│   │       │   └── storage/
│   │       │       ├── index.ts
│   │       │       ├── storage.client.ts
│   │       │       ├── storage.module.ts
│   │       │       ├── storage.service.ts
│   │       │       └── storage.types.ts
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── document/
│   │       │   ├── knowledge-space/
│   │       │   ├── upload/
│   │       │   │   ├── dto/
│   │       │   │   │   └── upload-document.dto.ts
│   │       │   │   ├── index.ts
│   │       │   │   ├── upload.controller.ts
│   │       │   │   ├── upload.module.ts
│   │       │   │   ├── upload.service.ts
│   │       │   │   └── upload.types.ts
│   │       │   └── user/
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── frontend/
├── docker/
├── packages/
├── .env.example
└── README.md
```

## 架构边界

后端数据库访问固定链路：

```text
Controller -> Service -> Repository -> PrismaService -> Prisma Client -> DB
```

对象存储固定链路：

```text
Business Module -> StorageService -> StorageClient -> MinIO Client
```

约束：

- Prisma 只存在于 `apps/backend/src/infrastructure/prisma`。
- MinIO SDK 只存在于 `apps/backend/src/infrastructure/storage/storage.client.ts`。
- Controller 不访问 Prisma，不调用 MinIO。
- Service 不直接访问 Prisma。
- Guard 只做认证或权限判断，不访问 Repository。
- 所有环境变量必须通过后端 `ConfigService` 或前端 `lib/env.ts` 访问。

## 配置系统

后端配置集中在 `apps/backend/src/config`：

- `env.schema.ts` 使用 zod 校验启动必需环境变量。
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

Document 是 KnowledgeSpace 下一级核心知识实体：

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
- 删除 Document 当前采用软删除，写入 `status = ARCHIVED`。

## ExecutionContext

后续所有 AI 模块统一使用 `ExecutionContext`：

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

`RequestContextService` 负责从认证用户创建上下文。Document 上传权限判断基于 `ExecutionContext.userId` 与 Space 成员关系。

## Knowledge Space API

```text
POST   /spaces
GET    /spaces
GET    /spaces/:id
PATCH  /spaces/:id
DELETE /spaces/:id
```

Space 是 Document、Chunk、Embedding、Graph、Memory 的聚合根。所有子资源访问必须先校验 Space 成员关系。

## Document API

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

## Object Storage

对象存储基础设施位于 `apps/backend/src/infrastructure/storage`，使用 MinIO npm package 封装统一对象存储能力。

`StorageService` 公开方法：

```ts
uploadObject(key, buffer, contentType);
getObject(key);
deleteObject(key);
exists(key);
```

设计：

- `StorageClient` 负责 MinIO SDK 初始化和 endpoint 解析。
- `StorageService` 在对象操作前调用 `ensureBucket()`，bucket 不存在时自动创建。
- MinIO 配置来自 `ConfigService.getMinioConfig()`。
- 业务模块不能直接引入 `minio` package。

## Upload API

```text
POST /spaces/:spaceId/documents/upload
Content-Type: multipart/form-data
```

表单字段：

```text
file
title?
description?
```

上传流程：

```text
Multipart Upload
-> UploadController
-> UploadService
-> validate Space role: OWNER | EDITOR
-> DocumentRepository.create(status = CREATED)
-> generate object key
-> StorageService.uploadObject()
-> DocumentRepository.update(storageKey, status = PROCESSING)
-> return Document
```

Object Key 格式：

```text
{spaceId}/{documentId}/{timestamp}/{filename}
```

文件校验：

```text
max size: 50MB
allowed: PDF, WORD, TXT, MARKDOWN, IMAGE, AUDIO, VIDEO
```

错误处理：

- StorageService/MinIO 上传失败时，Document 会更新为 `FAILED`。
- Controller 不访问 Prisma，不调用 MinIO。
- UploadService 编排 `DocumentRepository`、`KnowledgeSpaceRepository` 与 `StorageService`。

状态变化：

```text
CREATED -> PROCESSING
CREATED -> FAILED
```

后续 Parser 接入方式：

- Parser 监听或查询 `status = PROCESSING` 的 Document。
- Parser 通过 `StorageService.getObject(storageKey)` 读取源文件。
- Parser 输出必须继续挂载在同一个 `spaceId` 下。
- Parser 完成后再推进 Document 到 `READY` 或 `FAILED`。
- Parser 不直接访问 MinIO SDK，不绕过 Space 聚合边界。

## 启动方式

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm dev:backend
pnpm dev:frontend
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
