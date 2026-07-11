# TASK-068：Ops Console Productization

## 目标

把现有 Observability Workbench 升级为更适合演示和日常排障的运维控制台。

第一版聚焦：

```text
系统健康概览
Provider / 基础设施状态
近期执行失败与延迟
文档处理流水线状态
文档状态分布
可复跑的 smoke 指引
```

## 禁止项

- 不新增数据库表。
- 不引入外部 APM。
- 不实现远程执行 shell 命令。
- 不暴露 API key、password、prompt、answer、document content。
- 不让 Controller 访问 Prisma / Repository。
- 不让前端组件直接 `fetch`。
- 不做复杂运维权限后台；第一版仍使用登录用户上下文。

## 后端结构

新增：

```text
apps/backend/src/modules/ops/
├── dto/
│   └── ops-summary-query.dto.ts
├── entities/
│   └── ops-summary.entity.ts
├── index.ts
├── ops.controller.ts
├── ops.module.ts
├── ops.repository.ts
├── ops.service.ts
├── ops.types.ts
└── run-ops-smoke.ts
```

## API

```text
GET /ops/summary
```

Query：

```ts
interface OpsSummaryQuery {
  limit?: number; // 默认 10，最大 50
}
```

返回：

```ts
interface OpsSummary {
  generatedAt: string;
  readiness: {
    status: 'ok' | 'degraded';
    failedChecks: number;
    checks: ReadinessCheck[];
  };
  documents: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  pipeline: {
    recent: OpsPipelineJob[];
    byStatus: Array<{ status: string; count: number }>;
    failedLast24h: number;
  };
  executions: {
    recent: OpsExecutionRun[];
    byStatus: Array<{ status: string; count: number }>;
    failedLast24h: number;
    averageDurationMs: number | null;
  };
  actions: Array<{
    id: string;
    label: string;
    command: string;
    description: string;
  }>;
}
```

## 权限

- `GET /ops/summary` 需要 JWT。
- 只统计当前用户可访问 Space 下的文档和 Pipeline。
- Execution 只统计当前用户自己的 execution。
- tenant 过滤必须保留。

## 前端结构

新增：

```text
apps/frontend/services/ops.service.ts
apps/frontend/store/ops.store.ts
apps/frontend/types/ops.ts
apps/frontend/components/ops/
├── OpsConsole.tsx
├── OpsOverviewCards.tsx
├── OpsReadinessMatrix.tsx
├── OpsPipelineDigest.tsx
├── OpsExecutionDigest.tsx
└── OpsSmokeGuide.tsx
```

## UI 要求

- Observability tab 顶部展示 Ops Console。
- 告警优先显示：readiness degraded、pipeline failed、execution failed。
- 指标以“可读摘要”为主，不展示完整 Prometheus 文本。
- Smoke 指引只展示命令，不从浏览器触发命令。
- 保留现有 readiness / metrics / execution timeline 细节面板。

## 验收标准

- `/ops/summary` 可返回当前用户的运行概览。
- 前端 Observability 页面展示 Ops Console。
- 关闭或异常依赖时 readiness 能反映 degraded。
- 近期 pipeline / execution 失败能在控制台上看到。
- 前端组件、app、store 不直接 `fetch`。
- 真实 smoke 可验证 `/ops/summary`、readiness、pipeline/execution 聚合。
