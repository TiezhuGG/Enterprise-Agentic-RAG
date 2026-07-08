# TASK-031：流程设计

## 初始化流程

```text
AgentDebugWorkbench mount
↓
AgentDebugStore.initialize()
↓
读取 api-client 中保存的 authToken
↓
conversationService.list()
↓
如果不存在 conversation，则 conversationService.create('Debug Session')
↓
设置 active conversation
```

## 正常运行流程

```text
用户输入 question
↓
用户确认 runConfig
↓
AgentDebugStore.run()
↓
agentService.streamChat({
  conversationId,
  question,
  limit,
  vectorLimit,
  keywordLimit,
  maxContextTokens
})
↓
持续消费 SSE
↓
根据 event.type 更新状态
```

## SSE 事件流程

```text
thought
↓
记录 executionId、needsRetrieval、needsGraph

retrieval
↓
记录 retrievalCount

graph
↓
记录 graphCount

token
↓
追加 answer

citation
↓
追加 citations

done
↓
覆盖最终 answer、citations、trace、metadata、executionId

error
↓
停止 running，记录错误消息
```

## Event Timeline

每个事件进入前端后生成一条本地 timeline item：

```ts
{
  id: string;
  type: AgentEventType;
  timestamp: string;
  summary: string;
}
```

Timeline 不展示完整 prompt、Memory 原文、DocumentContent 正文。

## Trace Timeline

Trace 来源于 `done.data.metadata.trace`。

展示字段：

- node
- status
- startTime
- endTime
- duration

如果 graph 被跳过，则显示 `skipped`。

## 错误流程

```text
agentService.streamChat 抛错
↓
记录 error
↓
running=false
↓
追加 error timeline item
```

```text
SSE error event
↓
记录 error
↓
running=false
↓
追加 error timeline item
```

## Conversation 流程

```text
用户切换 conversation
↓
仅改变当前 conversationId
↓
清空本次 debug run 状态
```

本任务不在 Debug Workbench 中展示完整历史消息，历史消息由后端 AgentService 在执行时读取。
