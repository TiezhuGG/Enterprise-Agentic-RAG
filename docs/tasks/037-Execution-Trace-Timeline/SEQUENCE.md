# TASK-037：流程设计

## 成功流程

```text
POST /agent/chat 或 /agent/chat/stream
↓
AgentService 生成 requestId / executionId
↓
ExecutionService.startRun()
↓
AgentGraph 执行 memory / planner / retrieval / graph / answer / verification
↓
每个节点完成后 ExecutionService.recordEvent()
↓
AgentService 保存 assistant message
↓
ExecutionService.finishRun(SUCCEEDED)
↓
GET /executions/:executionId/timeline 可查询执行时间线
```

## 失败流程

```text
AgentService.startRun()
↓
AgentGraph 或前置步骤抛错
↓
ExecutionService.recordEvent(type=error,status=FAILED)
↓
ExecutionService.finishRun(FAILED)
↓
错误继续返回给调用方 / SSE error
```

## Timeline 查询流程

```text
GET /executions/:executionId/timeline
↓
JwtAuthGuard
↓
RequestContextService
↓
ExecutionService.getTimeline(context, executionId)
↓
ExecutionRepository.findRunByExecutionIdAndUserId()
↓
ExecutionRepository.listEventsByExecutionId()
↓
按 sequence 升序返回
```

## 事件顺序

第一版 sequence 由 ExecutionService 在内存中按一次 run 递增生成。

典型顺序：

```text
1 workflow STARTED
2 memory SUCCEEDED
3 planner SUCCEEDED
4 retrieval SUCCEEDED / SKIPPED
5 graph SUCCEEDED / SKIPPED
6 answer SUCCEEDED
7 verification SUCCEEDED
8 iteration SUCCEEDED（可选）
9 workflow SUCCEEDED / FAILED
```

## 数据安全

所有 metadata 都经过白名单/敏感字段过滤。

禁止写入：

- prompt
- answer
- content
- raw text
- token
- file
- buffer
- document content
- messages
