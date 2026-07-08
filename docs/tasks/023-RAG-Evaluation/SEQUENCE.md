# TASK-023 RAG Evaluation SEQUENCE

## 离线评估流程

```text
Developer
↓
pnpm --filter @enterprise-agentic-rag/backend evaluation:run
↓
run-evaluation.ts
↓
读取 docs/evaluation/dataset.example.json
↓
创建 Nest ApplicationContext
↓
EvaluationService.evaluateDataset()
↓
输出 JSON + Markdown report
```

## 单 Case Retrieval 流程

```text
EvaluationCase
↓
构建 ExecutionContext
↓
RetrievalService.retrieve()
↓
ContextChunk[]
↓
计算 expected citation 命中率
↓
retrievalRecall
```

## 单 Case Answer 流程

仅当 case 提供 `conversationId` 时执行：

```text
EvaluationCase
↓
AgentService.execute()
↓
AgentResponse
↓
answer
↓
citations
↓
计算 citationCoverage
↓
计算 answer expected-term coverage
↓
计算 groundedness
```

## 无 Conversation 流程

```text
case.conversationId 缺失
↓
跳过 AgentService
↓
answer 相关指标为 null
↓
仍输出 retrieval 指标
```

## 错误流程

```text
某个 case 抛错
↓
记录 case.status = failed
↓
记录安全 error message
↓
继续评估后续 case
```
