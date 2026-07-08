# TASK-038：架构决策记录

## 决策 1：`/health` 与 `/health/readiness` 分离

`/health` 保持轻量进程存活检查。

`/health/readiness` 才检查外部依赖。

原因：

- liveness 不应被外部依赖拖慢。
- readiness 可以用于部署入口和演示面板。

## 决策 2：模型 Provider 不做真实推理检查

LLM、Embedding、Reranker 在 readiness 中只做配置级检查。

原因：

- 避免健康检查产生模型费用。
- 避免污染模型服务日志。
- 避免健康检查被模型限流影响。

## 决策 3：不新增数据库表

TASK-038 只扩展内存 metrics 和 readiness API。

持久化执行历史已由 TASK-037 Execution Timeline 提供。

## 决策 4：ObservabilityService 保持 metrics/log 核心

Readiness 独立为 `ReadinessModule` / `ReadinessService`，避免把基础设施依赖塞进 metrics service 或全局 Observability 模块。

原因：

- 降低耦合。
- 保持 metrics 服务纯粹。
- 避免 `StorageService` / `VectorService` 记录指标时和 readiness 依赖链形成隐性循环。

## 决策 5：业务服务记录细分指标

Embedding、Reranker、Storage、Memory、Vector 由各自服务在调用边界记录指标。

原因：

- 指标贴近业务语义。
- 不让 provider/repository 反向依赖业务模块。
