# TASK-061：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Knowledge Space Member Management。

必须遵守：

- 严格保持 DDD 分层。
- Controller 不访问 Repository / Prisma。
- Service 负责业务规则。
- Repository 负责数据库。
- 前端组件不直接 `fetch`。
- 保持 `Component -> Store -> Service -> API`。

实现内容：

```text
GET    /spaces/:id/members
POST   /spaces/:id/members
PATCH  /spaces/:id/members/:userId
DELETE /spaces/:id/members/:userId
```

规则：

- 只有 OWNER 能管理成员。
- 不能移除最后一个 OWNER。
- 不能把最后一个 OWNER 降级。
- 添加成员按 email 查找用户。
- 目标用户不存在返回 404。
- 跨 tenant 添加返回 403。

前端：

- 新增 Space Members 面板。
- 可查看成员列表。
- 可输入 email 添加成员。
- 可修改角色。
- 可移除成员。
- 非 OWNER 显示只读状态。

验证：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```
