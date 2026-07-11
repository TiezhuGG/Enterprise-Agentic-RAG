# TASK-069：Execution Cost & Performance Metrics

## 目标

在 TASK-068 Ops Console 的基础上，补齐执行成本估算与性能指标，让演示和排障时可以回答：

```text
一次 Agent 执行大概用了多少 token？
估算成本是多少？
主要耗时在哪些节点？
最近执行的平均耗时 / P95 / 慢执行数量是多少？
```

## 边界说明

本任务输出的是“估算成本”，不是云厂商账单。

估算来源：

- Answer Node 的 prompt / output token 估算。
- ExecutionTraceEvent 的 node duration。
- ExecutionRun 的总 duration。

## 禁止项

- 不新增数据库表。
- 不调用外部 Billing API。
- 不记录 prompt、answer、document content、token 原文。
- 不展示 API key、password、secret。
- 不把成本逻辑写进 Controller。
- 前端组件、app、store 不直接 `fetch`。

## 配置

新增可选环境变量，默认值为 0，避免无配置时阻塞启动：

```text
COST_CURRENCY=USD
COST_LLM_INPUT_PER_1K=0
COST_LLM_OUTPUT_PER_1K=0
COST_EMBEDDING_PER_1K=0
```

说明：

- 单位为“每 1000 tokens 的价格”。
- 默认 0 表示只展示 token 和性能，不展示真实费用。
- 后续部署真实模型时可按供应商价格填写。

## 后端实现

新增：

```text
apps/backend/src/modules/execution/metrics/
├── execution-cost.types.ts
└── token-estimator.ts
```

扩展：

```text
apps/backend/src/modules/agent/nodes/answer.node.ts
apps/backend/src/modules/agent/graph/agent.state.ts
apps/backend/src/modules/agent/graph/agent.graph.ts
apps/backend/src/modules/execution/execution.service.ts
apps/backend/src/modules/ops/ops.repository.ts
apps/backend/src/modules/ops/ops.service.ts
apps/backend/src/modules/ops/ops.types.ts
```

Answer Node 写入安全 metadata：

```ts
{
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  currency: string;
  llmModel: string;
}
```

## Ops Summary 扩展

`GET /ops/summary` 返回新增字段：

```ts
cost: {
  currency: string;
  totalEstimatedCost: number;
  totalTokens: number;
  promptTokens: number;
  outputTokens: number;
  byModel: Array<{
    model: string;
    estimatedCost: number;
    totalTokens: number;
  }>;
}
performance: {
  averageDurationMs: number | null;
  p95DurationMs: number | null;
  slowExecutions: number;
  nodeLatency: Array<{
    node: string;
    averageDurationMs: number;
    maxDurationMs: number;
    count: number;
  }>;
}
```

## 前端实现

新增：

```text
apps/frontend/components/ops/OpsCostPerformancePanel.tsx
```

Ops Console 展示：

- estimated cost
- total tokens
- prompt/output tokens
- avg/P95 duration
- slow executions
- node latency breakdown

## 验收标准

- Agent answer trace metadata 包含 token/cost 估算。
- `/ops/summary` 返回 cost/performance。
- Ops Console 能展示成本与性能。
- 不展示 prompt/answer/document content。
- smoke 能真实读取已有 execution 并聚合成本/性能。
- 原有 Agent/Chat/Observability 链路不破坏。
