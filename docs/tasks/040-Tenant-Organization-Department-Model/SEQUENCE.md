# TASK-040：流程设计

## 登录流程

```text
POST /auth/login
↓
AuthService.login()
↓
UserRepository.findByEmail()
↓
读取 user.roles / spaces / tenant / organization / department
↓
构造 AuthenticatedUser
↓
JWT payload 写入 tenantId / organizationId / departmentId
↓
返回 accessToken + user
```

失败流程：

```text
用户未绑定 tenant
↓
tenantId / organizationId / departmentId 为 undefined
↓
允许登录
↓
后续 enterprise context 返回 null / []
```

## Request Context 流程

```text
JwtStrategy.validate(payload)
↓
AuthenticatedUser
↓
RequestContextService.create(user)
↓
ExecutionContext
```

输出：

```ts
{
  (userId, roles, permissions, spaceIds, tenantId, departmentId, metadata);
}
```

## Enterprise Context API

```text
GET /enterprise/context
↓
JwtAuthGuard
↓
EnterpriseController
↓
RequestContextService.create(user)
↓
EnterpriseService.getContext(context)
↓
EnterpriseRepository.findUserEnterpriseContext(userId)
↓
返回 tenant / organization / department
```

无归属：

```text
tenant = null
organization = null
department = null
```

## Organizations API

```text
GET /enterprise/organizations
↓
EnterpriseService.listOrganizations(context)
↓
如果 context.tenantId 不存在，返回 []
↓
EnterpriseRepository.listOrganizationsByTenant(context.tenantId)
```

## Departments API

```text
GET /enterprise/departments
↓
EnterpriseService.listDepartments(context)
↓
如果 context.tenantId 不存在，返回 []
↓
EnterpriseRepository.listDepartmentsByTenant(context.tenantId)
```

## KnowledgeSpace 创建流程

```text
POST /spaces
↓
KnowledgeSpaceService.create(context, dto)
↓
KnowledgeSpaceRepository.create({
  ownerId: context.userId,
  tenantId: context.tenantId,
  ...
})
↓
KnowledgeSpace.tenantId 写入
```

说明：

- TASK-040 只在创建时写入 tenantId。
- TASK-041 再对 list/get/update/delete 增加 tenant-aware 过滤。

## Seed 流程

```text
seed permissions / roles
↓
upsert default tenant
↓
upsert default organization
↓
upsert default department
↓
upsert admin user
↓
assign admin role
↓
assign admin enterprise membership
```

## 错误策略

- 查询当前用户 enterprise context 不因无 tenant 抛错。
- tenantId 不存在时组织/部门列表返回空数组。
- 数据库关系错误由 repository 抛出，service 不吞异常。
- Controller 不做业务判断。
