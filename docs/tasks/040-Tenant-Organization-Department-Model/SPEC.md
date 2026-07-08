# TASK-040：Tenant / Organization / Department Model

## 目标

实现多租户企业边界的第一步：建立企业组织模型，并让登录态和 `ExecutionContext` 具备真实的 `tenantId / organizationId / departmentId` 来源。

本任务只做基础建模和只读上下文，不做全链路租户权限过滤。

后续任务：

- TASK-041：Tenant-Aware RBAC。
- TASK-042：Data Permission Policy。

## 背景

当前代码中 `ExecutionContext` 和 JWT 已预留：

```ts
tenantId?: string;
departmentId?: string;
```

但数据库没有 Tenant / Organization / Department 模型，登录返回也没有真实企业归属。

TASK-040 要补齐这层基础设施。

## 禁止项

- 不实现多租户复杂权限策略。
- 不改 Retrieval / Agent / Graph 的权限算法。
- 不实现 Tenant CRUD 后台。
- 不实现 Organization CRUD 后台。
- 不实现 Department CRUD 后台。
- 不做跨租户数据迁移工具。
- 不做企业邀请 / 成员管理。
- 不做计费、套餐、订阅。
- 不让 Controller 访问 Prisma。
- 不让 Service 直接访问 Prisma。

## 数据库设计

新增 enum：

```prisma
enum EnterpriseStatus {
  ACTIVE
  DISABLED
}
```

新增模型：

```prisma
model Tenant {
  id
  code
  name
  status
  metadata
  createdAt
  updatedAt
}

model Organization {
  id
  tenantId
  code
  name
  status
  metadata
  createdAt
  updatedAt
}

model Department {
  id
  tenantId
  organizationId
  parentId?
  code
  name
  status
  metadata
  createdAt
  updatedAt
}
```

修改：

```prisma
User {
  tenantId?
  organizationId?
  departmentId?
}

KnowledgeSpace {
  tenantId?
}
```

说明：

- 第一版用户只归属一个默认 Tenant / Organization / Department。
- `KnowledgeSpace.tenantId` 先作为未来 tenant filter 的根字段。
- 历史数据允许 `tenantId = null`，避免破坏已有本地数据。

## 后端新增结构

新增：

```text
apps/backend/src/modules/enterprise/
├── enterprise.module.ts
├── enterprise.controller.ts
├── enterprise.service.ts
├── enterprise.repository.ts
├── enterprise.types.ts
├── dto/
├── entities/
└── index.ts
```

## API

新增只读 API：

```text
GET /enterprise/context
GET /enterprise/tenants/current
GET /enterprise/organizations
GET /enterprise/departments
```

权限：

- 必须登录。
- 查询结果基于当前用户的 `tenantId`。
- 用户没有 tenant 时返回空组织上下文，不报错。

## Auth 集成

登录成功后：

```ts
AuthenticatedUser {
  tenantId?: string;
  organizationId?: string;
  departmentId?: string;
  metadata: {
    enterprise?: {
      tenant?: { id; code; name };
      organization?: { id; code; name };
      department?: { id; code; name };
    }
  }
}
```

JWT Payload 增加：

```ts
tenantId;
organizationId;
departmentId;
```

`RequestContextService` 保持从 `AuthenticatedUser` 创建 `ExecutionContext`。

## Seed

默认 seed：

```text
Tenant: default / Default Tenant
Organization: default-org / Default Organization
Department: ai-lab / AI Lab
Admin user -> default tenant / default organization / ai-lab department
```

## 验收标准

- Prisma schema 新增 Tenant / Organization / Department。
- 生成 migration。
- seed 成功创建默认企业组织。
- admin 登录返回 tenantId / organizationId / departmentId。
- JWT validate 后 `req.user` 包含企业归属。
- `GET /auth/context` 返回 ExecutionContext 中的 tenantId / departmentId。
- `GET /enterprise/context` 返回当前用户企业上下文。
- `GET /enterprise/organizations` 返回当前 tenant 下组织。
- `GET /enterprise/departments` 返回当前 tenant 下部门。
- Controller 不访问 Prisma。
- Service 不访问 Prisma。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
- `pnpm db:validate` 通过。
- `pnpm db:migrate` 通过。
- `pnpm db:seed` 通过。
