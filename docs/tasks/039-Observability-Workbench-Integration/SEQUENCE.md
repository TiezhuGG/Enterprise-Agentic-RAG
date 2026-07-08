# TASK-039：流程设计

## 初始化流程

```text
DemoWorkbench mount
↓
workbenchStore.initialize()
↓
demoStore.initialize()
↓
observabilityStore.initialize()
↓
并发加载 readiness / metrics
↓
如果已有 token，加载 execution runs
```

说明：

- `/health` 和 `/health/readiness` 可匿名访问。
- `/executions` 需要 JWT。
- 未登录时 Observability tab 仍可展示 readiness / metrics，但 execution 区域显示 blocked 状态。

## Readiness 流程

```text
用户打开 Observability tab
↓
ObservabilityWorkbench
↓
observabilityStore.refreshReadiness()
↓
observabilityService.getReadiness()
↓
GET /health/readiness
↓
ReadinessCheckPanel 展示 checks
```

错误流程：

```text
GET /health/readiness 失败
↓
store.error = 短错误
↓
ReadinessCheckPanel 显示 degraded / unavailable
```

要求：

- 不阻塞其它面板。
- 不展示完整连接串或 secret。

## Metrics 流程

```text
ObservabilityWorkbench
↓
observabilityStore.refreshMetrics()
↓
observabilityService.getMetricsText()
↓
GET /metrics
↓
parseMetricsBreakdown(metricsText)
↓
MetricsBreakdownPanel 展示指标分组
```

第一版只解析指标名是否存在：

```text
agent_workflows_total
retrieval_requests_total
llm_requests_total
ingestion_requests_total
document_processing_total
embedding_requests_total
reranker_requests_total
vector_operations_total
storage_operations_total
memory_operations_total
provider_health_total
```

不做：

- PromQL。
- 时间序列图。
- 百分位统计 UI。

## Execution Runs 流程

```text
用户已登录
↓
ObservabilityWorkbench
↓
observabilityStore.loadExecutions(20)
↓
executionService.listExecutions()
↓
GET /executions?limit=20
↓
ExecutionRunList 展示最近执行
```

选择 execution：

```text
用户点击 execution run
↓
observabilityStore.selectExecution(executionId)
↓
并发：
  GET /executions/:executionId
  GET /executions/:executionId/timeline
↓
ExecutionRunDetailPanel + ExecutionTimeline 更新
```

错误流程：

```text
401 / 403
↓
显示需要登录或无权访问

404
↓
显示 execution 不存在或不属于当前用户
```

## Agent Debug 联动流程

```text
Agent Debug Run
↓
POST /agent/chat/stream
↓
SSE done event(data.executionId)
↓
agentDebugStore 保存 executionId
↓
用户点击 Open Timeline
↓
workbenchStore.setActiveTab('observability')
↓
observabilityStore.selectExecution(executionId)
↓
展示持久化 timeline
```

如果 timeline 还没完全落库：

```text
Timeline 为空或缺少 done / verification
↓
展示短提示
↓
用户点击 Refresh Timeline
```

## Timeline 渲染流程

```text
timeline events
↓
按 sequence 升序排序
↓
按 type / stage 显示节点
↓
渲染 status / duration / safe metadata / errorMessage
```

安全 metadata 策略：

```text
允许:
count / latency / status / needsRetrieval / needsGraph / needsMoreContext
iteration / maxIterations / verified / reason

禁止:
prompt / answer / content / messages / token / buffer / apiKey / password
```

## Refresh 流程

```text
用户点击 Refresh
↓
并发刷新 readiness / metrics
↓
如果已登录，刷新 executions
↓
如果已选择 execution，刷新 timeline
```

Refresh 不做自动轮询，避免演示环境产生过多请求。
