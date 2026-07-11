# TASK-068：Review Checklist

## 实现前

- [x] 阅读 Observability Workbench。
- [x] 阅读 ReadinessService。
- [x] 阅读 Execution 模块。
- [x] 阅读 Pipeline 数据结构。
- [x] 阅读 Workbench / Admin Console 现有布局。

## 实现后

- [x] 新增 Ops module。
- [x] 新增 `/ops/summary`。
- [x] OpsController 不访问 Repository / Prisma。
- [x] OpsService 聚合 readiness、documents、pipeline、executions、actions。
- [x] OpsRepository 过滤当前用户可访问 Space。
- [x] 新增 `ops:smoke`。
- [x] 前端新增 ops.service / ops.store / ops types。
- [x] Observability tab 顶部展示 Ops Console。
- [x] 组件、app、store 不直接 `fetch`。
- [x] 修复 Provider Readiness 与 API 错误提示中的历史乱码文案。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `pnpm db:validate`
- [x] `pnpm ops:smoke`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

## Smoke

- [x] `/ops/summary` 聚合可用。
- [x] readiness 信息存在。
- [x] documents/pipeline/executions 聚合结构存在。
- [x] smoke actions 存在。
- [x] 不输出 secret、prompt、answer、document content。

## Smoke 结果摘要

```json
{
  "actionCount": 5,
  "documentTotal": 12,
  "executionRecentCount": 5,
  "failedExecutionsLast24h": 0,
  "failedPipelineLast24h": 0,
  "pipelineRecentCount": 5,
  "readiness": {
    "failedChecks": 0,
    "status": "ok",
    "totalChecks": 12
  },
  "userEmail": "admin@example.com"
}
```

## 自审结论

- OpsController 只负责鉴权、query DTO 和 ExecutionContext 创建。
- OpsService 只做只读聚合，不复制 Document / Pipeline / Execution 业务规则。
- OpsRepository 是唯一新增 Prisma 查询入口，并按当前用户可访问 Space 与当前 userId 过滤。
- 前端 Ops Console 通过 `Component -> Store -> Service -> API` 调用，不直接在组件/app/store 中 `fetch`。
- Smoke 指引只展示命令，不允许浏览器远程执行 shell。
