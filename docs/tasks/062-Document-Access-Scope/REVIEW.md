# TASK-062：Review Checklist

## 实现前

- [x] 阅读 Document schema。
- [x] 阅读 DocumentService。
- [x] 阅读 DocumentRepository。
- [x] 阅读 AccessPolicyService。
- [x] 阅读 DocumentMetadataBuilder。
- [x] 阅读 Chunk metadata 传播逻辑。

## 实现后

- [x] `Document` 新增 `accessScope`。
- [x] Document entity/type 支持 access scope。
- [x] Repository 支持 normalized access scope。
- [x] Service 支持读取与修改 access scope。
- [x] Controller 暴露 access scope API。
- [x] Metadata builder 继承 document access scope。
- [x] 前端 service 增加 access scope API。
- [x] 前端 store 增加 access scope state/actions。
- [x] 前端新增 Document Access Scope 面板。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `pnpm db:validate`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

说明：`pnpm build` 使用 Windows 稳定环境变量执行：`NEXT_TELEMETRY_DISABLED=1`、`NODE_OPTIONS=--max-old-space-size=4096`。

## Smoke

- [ ] OWNER/EDITOR 可修改文档访问范围。
- [ ] VIEWER 不能修改文档访问范围。
- [ ] 修改为 CONFIDENTIAL 后普通用户无法读取。
- [ ] 重新 ingest 后 DocumentContent metadata 继承 access scope。
- [ ] Chunk metadata 继承 access scope。
- [ ] Search/Retrieval 不返回无权限文档。

说明：Smoke 需要执行 migration、启动服务、准备不同部门/角色用户后手工验证。
