# TASK-061：Review Checklist

## 实现前

- [x] 阅读 KnowledgeSpaceRepository。
- [x] 阅读 KnowledgeSpaceService。
- [x] 阅读 KnowledgeSpaceController。
- [x] 阅读 SpaceMember schema。
- [x] 阅读前端 workbench store/service。

## 实现后

- [x] 新增 add/update member DTO。
- [x] Repository 支持成员列表、添加、修改、删除、OWNER 计数。
- [x] Service 实现 OWNER 管理权限。
- [x] Service 实现最后 OWNER 保护。
- [x] Controller 暴露 members API。
- [x] 前端 service 增加 members API。
- [x] 前端 store 增加 members state/actions。
- [x] 前端新增 Space Members 面板。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

说明：Windows 本地 `next build` 默认退出时曾出现原生非零退出码；设置 `NEXT_TELEMETRY_DISABLED=1` 和 `NODE_OPTIONS=--max-old-space-size=4096` 后，前端与全仓库 build 均通过。

## Smoke

- [ ] OWNER 可查看成员。
- [ ] OWNER 可添加成员。
- [ ] OWNER 可修改角色。
- [ ] OWNER 可移除非最后 OWNER。
- [ ] 最后 OWNER 不能被移除或降级。
- [ ] EDITOR / VIEWER 不能管理成员。

说明：Smoke 需要启动后端、登录不同 Space 角色用户后手工验证。
