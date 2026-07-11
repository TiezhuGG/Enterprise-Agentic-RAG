# TASK-068：Sequence

## Ops Summary 正常流程

```text
User
-> GET /ops/summary
-> OpsController
-> RequestContextService.create()
-> OpsService.getSummary()
-> ReadinessService.getReadiness()
-> OpsRepository.countDocumentsByStatus()
-> OpsRepository.listRecentPipelineJobs()
-> OpsRepository.countPipelineJobsByStatus()
-> OpsRepository.listRecentExecutionRuns()
-> OpsRepository.countExecutionRunsByStatus()
-> return OpsSummary
```

## 前端加载流程

```text
ObservabilityWorkbench
-> useOpsStore.initialize()
-> ops.service.getSummary()
-> OpsConsole
-> Overview / Readiness / Pipeline / Execution / Smoke Guide
```

## 错误流程

```text
Ops API failed
-> ops.store.error
-> OpsConsole 显示短错误
-> 现有 Observability 细节面板仍可独立刷新
```

## 数据隔离流程

```text
ExecutionContext(userId, tenantId)
-> OpsRepository 查询当前用户 SpaceMember
-> Document / Pipeline 只按可访问 spaceId 聚合
-> Execution 只按 userId 聚合
```

## Smoke 流程

```text
pnpm ops:smoke
-> create Nest application context
-> find admin user
-> create ExecutionContext
-> call OpsService.getSummary()
-> assert readiness exists
-> assert smoke actions exist
-> assert document / pipeline / execution sections exist
-> print JSON summary
```

说明：

- Smoke 不会创建或删除业务数据。
- Smoke 只验证聚合 API 和当前真实依赖状态。
