# TASK-061：Sequence

## 查看成员

```text
Frontend Space Members Panel
-> workbench.store.loadSpaceMembers()
-> knowledgeSpaceService.listMembers(spaceId)
-> GET /spaces/:id/members
-> KnowledgeSpaceController
-> KnowledgeSpaceService
-> KnowledgeSpaceRepository
-> Prisma SpaceMember + User
```

## 添加成员

```text
OWNER 输入 email + role
-> addSpaceMember()
-> POST /spaces/:id/members
-> 校验当前用户是 OWNER
-> 根据 email 查找目标用户
-> 校验 tenant
-> upsert SpaceMember
-> 返回成员列表
```

## 修改角色

```text
OWNER 选择新 role
-> PATCH /spaces/:id/members/:userId
-> 校验当前用户是 OWNER
-> 如果目标是最后一个 OWNER 且要降级，拒绝
-> update SpaceMember.role
-> 返回成员列表
```

## 移除成员

```text
OWNER 点击 Remove
-> DELETE /spaces/:id/members/:userId
-> 校验当前用户是 OWNER
-> 如果目标是最后一个 OWNER，拒绝
-> delete SpaceMember
-> 返回成员列表
```

## 错误流程

- Space 不存在或不可访问：404。
- 当前用户不是 OWNER：403。
- 目标用户不存在：404。
- 跨 tenant 添加：403。
- 最后一个 OWNER 被移除或降级：400。

## 前端状态

```text
selectedSpaceId change
-> loadSpaceMembers()
-> members panel render
```

添加、修改、删除成功后刷新成员列表和空间列表，保证角色变化会影响后续权限。
