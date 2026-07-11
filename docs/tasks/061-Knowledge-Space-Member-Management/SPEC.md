# TASK-061：Knowledge Space Member Management

## 目标

实现知识空间成员管理，让 Space OWNER 能添加成员、移除成员、修改成员角色。

这是后续 Document Access Scope、空间类型治理和企业权限闭环的基础。

## 禁止项

- 不实现邮件邀请。
- 不实现注册流程。
- 不实现后台用户管理。
- 不实现复杂组织通讯录。
- 不允许 Controller 直接访问 Prisma。
- 不允许前端组件直接 `fetch`。
- 不允许移除或降级最后一个 OWNER。

## 后端范围

扩展现有：

```text
apps/backend/src/modules/knowledge-space/
```

新增 DTO：

```text
dto/add-space-member.dto.ts
dto/update-space-member.dto.ts
```

新增 API：

```text
GET    /spaces/:id/members
POST   /spaces/:id/members
PATCH  /spaces/:id/members/:userId
DELETE /spaces/:id/members/:userId
```

## 权限规则

- OWNER 可以查看、添加、修改、移除成员。
- EDITOR / VIEWER 不能管理成员。
- 不能移除自己作为最后一个 OWNER。
- 不能把最后一个 OWNER 降级为 EDITOR / VIEWER。
- 添加成员时目标用户必须存在。
- 目标用户必须属于同一 tenant；tenant 为空的历史数据按现有兼容策略处理。

## 前端范围

扩展 Demo Workbench / Console：

- 新增 Space Members 面板。
- 显示成员列表和角色。
- 支持按 email 添加成员。
- 支持修改角色。
- 支持移除成员。
- 对非 OWNER 显示只读状态。

调用链保持：

```text
Component -> Store -> Service -> API
```

## 验收标准

- OWNER 可以管理成员。
- EDITOR / VIEWER 无法管理成员。
- 最后一个 OWNER 保护生效。
- 添加不存在用户返回清晰错误。
- 前端可查看成员、添加成员、修改角色、移除成员。
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
