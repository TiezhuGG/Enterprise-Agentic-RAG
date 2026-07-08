# TASK-040：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

必须严格遵守 DDD 分层和现有目录结构。

## 任务

实现 TASK-040：Tenant / Organization / Department Model。

在写代码前必须阅读：

```text
docs/tasks/040-Tenant-Organization-Department-Model/SPEC.md
docs/tasks/040-Tenant-Organization-Department-Model/SEQUENCE.md
docs/tasks/040-Tenant-Organization-Department-Model/ADR.md
docs/tasks/040-Tenant-Organization-Department-Model/REVIEW.md
docs/tasks/040-Tenant-Organization-Department-Model/CODEX.md
```

## 目标

建立企业多租户基础模型：

- Tenant
- Organization
- Department

并将用户登录态升级为真实企业上下文：

- tenantId
- organizationId
- departmentId

## 必须实现

### Prisma

修改：

```text
apps/backend/prisma/schema.prisma
```

新增：

```prisma
enum EnterpriseStatus {
  ACTIVE
  DISABLED
}

model Tenant
model Organization
model Department
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

生成 migration。

### 后端模块

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

API：

```text
GET /enterprise/context
GET /enterprise/tenants/current
GET /enterprise/organizations
GET /enterprise/departments
```

### Auth 集成

修改：

```text
apps/backend/src/modules/user/user.repository.ts
apps/backend/src/modules/auth/auth.types.ts
apps/backend/src/modules/auth/auth.service.ts
apps/backend/src/modules/auth/strategies/jwt.strategy.ts
```

要求：

- login response user 包含 tenantId / organizationId / departmentId。
- JWT payload 包含 tenantId / organizationId / departmentId。
- JwtStrategy validate 后 req.user 保留这些字段。
- metadata.enterprise 包含 tenant / organization / department 简要信息。

### Knowledge Space 集成

修改：

```text
apps/backend/src/modules/knowledge-space/
```

要求：

- 创建 Space 时写入 `tenantId: context.tenantId`。
- Entity 返回 `tenantId`。
- 本任务不改变 list/get/update/delete 的权限判断。

### Seed

修改：

```text
apps/backend/src/infrastructure/prisma/seed.ts
```

要求：

- 幂等创建 default tenant。
- 幂等创建 default organization。
- 幂等创建 ai-lab department。
- 将 admin user 绑定到这些 enterprise records。

## 禁止

- 禁止 Controller 访问 Prisma。
- 禁止 Service 直接访问 Prisma。
- 禁止实现复杂 tenant-aware retrieval。
- 禁止实现企业后台 CRUD。
- 禁止破坏现有登录、Space、Agent Demo。

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:migrate
pnpm db:seed
```

如迁移需要名称：

```bash
pnpm --filter @enterprise-agentic-rag/backend prisma migrate dev --name task_040_enterprise_model --config prisma.config.ts
```

## 输出

完成后输出：

1. 新增目录结构。
2. 数据库设计。
3. Enterprise API。
4. Auth / ExecutionContext 集成。
5. Seed 说明。
6. 验证结果。
