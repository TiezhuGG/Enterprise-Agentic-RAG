# TASK-040：Review Checklist

## 实现前

- [x] 已确认 `ExecutionContext` 已有 `tenantId / departmentId`。
- [x] 已确认 JWT payload 已预留 `tenantId / departmentId`。
- [x] 已确认本任务不实现 tenant-aware retrieval。
- [x] 已确认本任务不实现企业后台 CRUD。
- [x] 已确认当前 TASK-039 未提交改动不能回退。

## 实现后

- [x] 新增 5 个任务文档。
- [x] Prisma schema 新增 `EnterpriseStatus`。
- [x] Prisma schema 新增 `Tenant`。
- [x] Prisma schema 新增 `Organization`。
- [x] Prisma schema 新增 `Department`。
- [x] `User` 增加 `tenantId / organizationId / departmentId`。
- [x] `KnowledgeSpace` 增加 `tenantId`。
- [x] 生成 migration。
- [x] 新增 `modules/enterprise`。
- [x] `EnterpriseRepository` 封装 Prisma。
- [x] `EnterpriseService` 不访问 Prisma。
- [x] `EnterpriseController` 不写业务逻辑。
- [x] 新增只读 enterprise API。
- [x] `UserRepository.findByEmail/findById/upsert` 返回企业归属。
- [x] `AuthService.login` 写入企业归属到 user 和 JWT。
- [x] `JwtStrategy.validate` 保留企业归属。
- [x] seed 创建默认企业组织并绑定 admin。
- [x] 前端 auth type 兼容新增字段。
- [x] `pnpm format:check` 通过。
- [x] `pnpm lint` 通过。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `pnpm db:validate` 通过。
- [x] `pnpm db:migrate` 通过。
- [x] `pnpm db:seed` 通过。

## Smoke

1. 运行 `pnpm db:migrate`。
2. 运行 `pnpm db:seed`。
3. 登录 admin。
4. 确认 login response user 有 tenantId / organizationId / departmentId。
5. 调用 `GET /auth/context`，确认 ExecutionContext 有 tenantId / departmentId。
6. 调用 `GET /enterprise/context`，确认 tenant / organization / department 存在。
7. 调用 `GET /enterprise/organizations`，确认能看到 default organization。
8. 调用 `GET /enterprise/departments`，确认能看到 ai-lab department。
9. 创建 Space，确认新 Space 带 tenantId。

## 风险点

- 不要把 `tenantId` 改成 required，避免破坏历史数据。
- 不要在 TASK-040 中顺手改 Retrieval 权限。
- 不要引入多租户切换 UI。
- 不要让 AuthService 直接访问 Prisma。
- Seed 必须幂等。
