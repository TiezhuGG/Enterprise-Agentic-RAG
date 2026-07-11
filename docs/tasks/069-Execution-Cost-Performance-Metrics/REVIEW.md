# TASK-069：Review Checklist

## 实现前

- [x] 阅读 AnswerNode。
- [x] 阅读 AgentState / AgentGraph trace。
- [x] 阅读 ExecutionService metadata sanitizer。
- [x] 阅读 Ops Summary 聚合。
- [x] 阅读 Ops Console 前端组件。

## 实现后

- [x] 新增 cost config。
- [x] 新增 token estimator。
- [x] AnswerNode 记录 answerMetrics。
- [x] AgentGraph answer trace 写入 token/cost metadata。
- [x] ExecutionService 允许安全 cost/performance metadata。
- [x] Ops Summary 返回 cost/performance。
- [x] Ops Console 展示成本与性能。
- [x] `ops:smoke` 校验 cost/performance 结构。
- [x] 前端组件、app、store 不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `pnpm db:validate`
- [x] `pnpm ops:smoke`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

## Smoke

- [x] cost section 存在。
- [x] performance section 存在。
- [x] readiness 仍可用。
- [x] 不输出 secret、prompt、answer、document content。

## Smoke 结果摘要

```json
{
  "cost": {
    "currency": "USD",
    "totalEstimatedCost": 0,
    "totalTokens": 168
  },
  "performance": {
    "averageDurationMs": 25100,
    "nodeLatencyCount": 5,
    "p95DurationMs": 43815,
    "slowExecutions": 18
  },
  "readiness": {
    "failedChecks": 0,
    "status": "ok",
    "totalChecks": 12
  }
}
```

说明：`totalEstimatedCost=0` 是因为当前 `.env` 中成本单价默认均为 0；token 统计和性能聚合已正常工作。

## 自审结论

- AnswerNode 只记录 token 数、模型名、币种和估算费用，不记录 prompt / answer / context 正文。
- ExecutionService metadata 白名单只放行安全数字和短字符串。
- Ops Summary 复用现有 ExecutionRun / ExecutionTraceEvent，不新增数据库表。
- 前端 Cost & Performance 面板只展示聚合指标和节点耗时。
- Smoke 通过 synthetic execution 验证聚合链路，不依赖外部 billing 服务。
