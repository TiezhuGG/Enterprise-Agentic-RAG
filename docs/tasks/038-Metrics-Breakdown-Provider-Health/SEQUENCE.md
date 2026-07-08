# TASK-038：流程设计

## `/health` 流程

```text
GET /health
↓
ObservabilityController
↓
ObservabilityService.getHealth()
↓
返回进程 liveness
```

不访问数据库、Redis、MinIO、Neo4j 或模型服务。

## `/health/readiness` 流程

```text
GET /health/readiness
↓
ReadinessController
↓
ReadinessService.getReadiness()
↓
并发执行基础设施检查
↓
记录 provider_health 指标
↓
返回 ok / degraded
```

## Provider 检查策略

真实依赖检查：

```text
database -> SELECT 1
redis -> PING
storage -> ensureBucket
graph -> RETURN 1 AS ok
vector -> lightweight DB delegate check
```

配置级检查：

```text
llm -> API URL / model / max tokens 是否存在
embedding -> API URL / model / dimension 是否存在
reranker -> API URL / model 是否存在
```

## 指标记录流程

```text
业务方法开始
↓
记录 startedAt
↓
调用 provider / infrastructure
↓
成功：recordXxx(status=success)
失败：recordXxx(status=failed,error)
↓
保留原异常语义
```

## 敏感数据处理

metrics label 和 readiness message 只允许：

- provider / operation / status
- durationMs
- count
- sanitized error message

禁止：

- API key
- password
- prompt
- answer
- document content
- token 原文
