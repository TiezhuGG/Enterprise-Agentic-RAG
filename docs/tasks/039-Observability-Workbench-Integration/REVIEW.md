# TASK-039：Review Checklist

## 实现前

- [x] 已确认 TASK-037 Execution API 可用。
- [x] 已确认 TASK-038 `/health/readiness` 可用。
- [x] 已确认 `/metrics` 包含新增 breakdown 指标。
- [x] 已确认本任务不新增数据库模型。
- [x] 已确认本任务不改 Agent 编排。
- [x] 已确认前端组件不能直接 `fetch`。

## 实现后

- [x] 新增 5 个任务文档。
- [x] 新增 `types/observability.ts`。
- [x] 新增 `services/execution.service.ts`。
- [x] 新增 `services/observability.service.ts`。
- [x] 新增 `store/observability.store.ts`。
- [x] 新增 `components/observability/*`。
- [x] `DemoWorkbench` 新增 Observability tab。
- [x] 未登录时仍可查看 readiness / metrics。
- [x] 已登录时可查看 execution runs。
- [x] 选择 execution 后可查看 detail 和 timeline。
- [x] Agent Debug done 后可跳转到对应 timeline。
- [x] Timeline 按 sequence 排序。
- [x] Metadata 渲染做敏感字段过滤。
- [x] 不展示完整 prompt。
- [x] 不展示完整 answer。
- [x] 不展示 document content。
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store` 无违规。
- [x] `pnpm format:check` 通过。
- [x] `pnpm lint` 通过。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。

## Smoke

1. 打开首页。
2. 未登录时进入 Observability tab。
3. 确认 readiness / metrics 可见。
4. 登录 `admin@example.com / password`。
5. 运行一次 Agent Debug。
6. 点击 Open Timeline。
7. 确认跳转到 Observability tab。
8. 确认 timeline 包含 memory / planner / retrieval / answer / verification。
9. 确认 graph 失败或 skipped 时能清楚展示。
10. 确认 metadata 不包含 prompt、answer、document content。

## 风险点

- 前端类型必须兼容后端 Date 序列化后的 string。
- Execution timeline 可能在 done 事件后短暂未完全刷新，要允许手动刷新。
- Metrics text 解析不能假设指标顺序。
- Readiness degraded 不能被展示成系统完全不可用。
- 不要把 Observability tab 做成完整 APM 产品，避免范围膨胀。
