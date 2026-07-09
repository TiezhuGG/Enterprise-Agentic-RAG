# TASK-045：流程设计

## 正常 Retrieval 流程

```text
RetrievalService.retrieveWithBreakdown(context, request)
-> validate query
-> createTenantScopedContext()
-> ContextBuilder.build()
-> run vector retriever
-> run keyword retriever
-> run graph retriever
-> load document metadata
-> AccessPolicyService.filterRetrievalResults()
-> RRF fusion
-> Reranker
-> ContextBuilder.buildContextChunks()
-> return { chunks, breakdown }
```

## Stage Breakdown 流程

每个阶段都记录：

```text
stage
status
durationMs
inputCount
outputCount
reason
```

规则：

- 成功阶段：`status=success`。
- `enableGraph=false`：graph stage 为 `skipped`。
- 无 retrieval 权限：所有召回阶段为 `skipped`。
- 任意阶段异常：该阶段 `status=failed`，然后继续抛出错误。

## Permission Filter 流程

```text
vectorResults + keywordResults + graphResults
-> load DocumentContent.metadata
-> AccessPolicyService.filterRetrievalResults()
-> filteredResultSets
```

权限仍以 `AccessPolicyService` 为权威。

Elasticsearch / PGVector / Neo4j 只做候选召回和粗过滤，不作为最终权限引擎。

## RRF 流程

```text
filtered vector results
+ filtered keyword results
+ filtered graph results
-> RrfFusion.fuse(resultSets, limit)
-> rrfResults
```

公式不变：

```text
score(d)=Σ1/(60+rank)
```

## Reranker 流程

```text
rrfResults
-> RerankerService.rerank(query, rrfResults)
-> rerankedResults
```

如果 `rrfResults.length === 0`，RerankerService 保持 skipped 语义。

## Context Builder 流程

```text
rerankedResults
-> sort by score
-> apply maxContextTokens
-> ContextChunk[]
```

Breakdown 记录最终 `contextCount`，不记录 context 正文。

## Agent Trace 流程

```text
AgentGraph retrieval node
-> RetrievalNode.run()
-> RetrievalTool.retrieveWithBreakdown()
-> AgentState.retrievalBreakdown
-> AgentGraph.getTraceMetadata('retrieval')
-> ExecutionService.recordEvent()
-> /executions/:id/timeline
-> frontend Observability Timeline
```

## Evaluation 流程

```text
EvaluationService.evaluateCase()
-> RetrievalService.retrieveWithBreakdown()
-> calculate metrics
-> include retrievalBreakdown in case result
-> markdown report prints short counts
```

## 错误流程

### Retriever 失败

```text
runRetrieverStage()
-> record stage failed
-> throw
-> RetrievalService record hybrid retrieval failed
```

### Permission Filter 输出为空

```text
permission-filter outputCount=0
-> RRF outputCount=0
-> reranker outputCount=0
-> context-builder outputCount=0
-> return []
```

这是合法成功结果，不视为错误。

## 安全要求

- 不记录完整 query。
- 不记录 chunk content。
- 不记录 prompt / answer。
- breakdown 只保存 count、duration、status、reason。
