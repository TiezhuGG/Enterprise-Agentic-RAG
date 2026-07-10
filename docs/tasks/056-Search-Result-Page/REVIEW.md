# TASK-056：Review Checklist

## 实现前

- [x] 阅读现有 `search.store.ts`。
- [x] 阅读 TASK-055 Search API 类型。
- [x] 阅读 DemoWorkbench tab 结构。
- [x] 阅读 Console SearchPage 结构。

## 实现后

- [x] 新增 5 个任务文档。
- [x] 新增 `services/search.service.ts`。
- [x] 新增 `types/search.ts`。
- [x] 改造 `store/search.store.ts`。
- [x] 新增 `components/search`。
- [x] Demo Workbench 新增 Search tab。
- [x] Console SearchPage 复用 Search Center。
- [x] 组件不直接 `fetch`。
- [x] 搜索页不调用 Agent API。
- [x] 支持 mode / q / spaceId / documentType / limit / offset / sort。
- [x] 支持空状态和错误状态。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`

## Smoke

- [ ] 登录后进入 Search Center。
- [ ] 输入“报销”执行全文搜索。
- [ ] 输入“报销审批”执行语义搜索。
- [ ] 执行混合搜索，查看 breakdown。
- [ ] 切换文件类型过滤。
- [ ] 未选择 Space 时显示提示。
