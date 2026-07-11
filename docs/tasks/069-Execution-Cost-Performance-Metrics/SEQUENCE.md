# TASK-069：Sequence

## Agent 执行记录流程

```text
AnswerNode
-> PromptBuilder.build()
-> TokenEstimator.countMessages()
-> LlmProvider.chat/stream()
-> TokenEstimator.countText(answer)
-> build answerMetrics
-> AgentState.answerMetrics
-> AgentGraph.getTraceMetadata('answer')
-> ExecutionService.recordEvent()
-> ExecutionTraceEvent.metadata
```

## Ops 聚合流程

```text
GET /ops/summary
-> OpsController
-> OpsService.getSummary()
-> OpsRepository.listCostEventsByUser()
-> OpsRepository.listPerformanceEventsByUser()
-> aggregate cost/performance
-> return OpsSummary
```

## 前端展示流程

```text
ObservabilityWorkbench
-> useOpsStore.initialize()
-> ops.service.getSummary()
-> OpsConsole
-> OpsCostPerformancePanel
```

## 无成本配置流程

```text
COST_* 默认 0
-> token 正常统计
-> estimatedCost = 0
-> UI 展示 estimated cost 0，并保留 token/performance
```

## Smoke 流程

```text
pnpm ops:smoke
-> get OpsSummary
-> assert cost section exists
-> assert performance section exists
-> assert no sensitive body fields
-> print summary
```

说明：

- 如果当前数据库没有带 answerMetrics 的新 execution，cost 可以为 0。
- smoke 仍应通过，因为它验证的是聚合结构和安全边界。
