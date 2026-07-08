# TASK-040：架构决策记录

## 决策 1：先做单归属模型

第一版用户只归属一个 Tenant / Organization / Department。

原因：

- MVP 演示需要清晰的企业边界。
- 当前 JWT 和 ExecutionContext 已按单值字段预留。
- 多租户多组织多部门成员关系会显著扩大任务范围。

后果：

- 后续如果要支持多租户切换，可以引入 `UserTenantMembership`。
- 当前版本足够支撑 tenant-aware filter 的第一版。

## 决策 2：`KnowledgeSpace` 增加可空 `tenantId`

Knowledge Space 是 RAG 系统根聚合，未来必须归属于 Tenant。

本任务将 `tenantId` 写入 `KnowledgeSpace`，但允许为空。

原因：

- 不破坏已有本地数据。
- 后续 TASK-041 可以基于新创建数据做租户过滤。

后果：

- 历史 space 需要后续迁移或补全 tenantId。
- TASK-041 需要定义 `tenantId = null` 的兼容策略。

## 决策 3：本任务不做强制权限过滤

TASK-040 只建立企业模型和登录上下文。

原因：

- 权限过滤会横切 Space / Document / Retrieval / Graph / Execution。
- 应单独在 TASK-041 中实现并验证。

后果：

- 本任务完成后不会改变现有访问行为。
- 但新建 Space 会带上 tenantId，为下一步过滤做准备。

## 决策 4：新增 `enterprise` 模块承载只读企业上下文

模块名使用 `enterprise`，而不是只叫 `tenant`。

原因：

- 本任务包含 Tenant / Organization / Department。
- `enterprise` 更贴近企业组织边界，而不仅是租户表。

后果：

- 后续企业成员、部门策略、组织画像都可以收敛到该模块。

## 决策 5：Seed 创建默认企业组织

开发和演示环境需要 admin 登录后立即具备 tenant context。

因此 seed 默认创建：

```text
default tenant
default organization
ai-lab department
```

后果：

- 本地 smoke 更稳定。
- 简历演示中可以解释“企业上下文已经贯穿 JWT 和 ExecutionContext”。
