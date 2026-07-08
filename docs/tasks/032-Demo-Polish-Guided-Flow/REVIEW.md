# TASK-032：Review Checklist

## 实现前

- [ ] 已阅读 TASK-032 SPEC。
- [ ] 已确认不新增后端 API。
- [ ] 已确认 `/health` 和 `/metrics` 可用。
- [ ] 已确认组件不直接 `fetch`。
- [ ] 已确认不展示完整 prompt / Memory / DocumentContent。

## 实现中

- [ ] 新增 `types/demo.ts`。
- [ ] 新增 `services/system.service.ts`。
- [ ] 新增 `store/demo.store.ts`。
- [ ] 新增 `components/demo/`。
- [ ] Workbench sidebar 接入 readiness。
- [ ] Workbench 主区域接入 guide。
- [ ] Agent Debug 接入示例问题。
- [ ] 空状态替换为清晰短状态。
- [ ] 错误状态不泄露 secret。

## 实现后

- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。
- [ ] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store` 无结果。

## Smoke

- [ ] 首页显示三个 tab。
- [ ] System readiness 可刷新。
- [ ] 无 token 时 checklist 显示 blocked。
- [ ] Space 创建或选择后 checklist 更新。
- [ ] 文档上传后 checklist 更新。
- [ ] Ingest 完成后 checklist 更新。
- [ ] Agent Debug 示例问题能填充 question。
- [ ] citation 和 metadata 不展示完整正文。
