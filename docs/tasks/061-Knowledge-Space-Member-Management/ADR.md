# TASK-061：ADR

## 决策

成员管理继续放在 `knowledge-space` 模块内，不新增独立 Member 模块。

## 原因

SpaceMember 是 KnowledgeSpace 聚合下的成员关系，不应单独成为跨领域服务。后续 Document Access Scope、Retrieval 权限过滤和 Citation 权限判断都依赖 Space membership，因此成员管理应由 KnowledgeSpaceService 统一维护。

## 边界

- Repository 负责 Prisma 读写。
- Service 负责 OWNER 权限、最后 OWNER 保护、tenant 校验。
- Controller 只做路由和 DTO。
- Frontend service 负责 API 调用。
- Store 负责状态和错误。
- Component 只渲染和触发 store action。

## 取舍

第一版使用 email 添加成员，避免引入用户搜索和组织通讯录。

第一版不做邀请链接，因为项目当前目标是可演示 MVP，不需要邮件系统。

第一版不做复杂审计表；成员变更可以在后续 Ops / Audit 任务中补充。

## 后果

后续 TASK-062 可以直接复用 SpaceMemberRole：

```text
tenantId + spaceRole + document securityLevel + department scope
```

后续 TASK-063 可以在 Space 类型上叠加成员策略，而不需要改成员管理 API。
