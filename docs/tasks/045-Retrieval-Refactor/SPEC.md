# TASK-045：Retrieval Refactor

## 目标

统一 PGVector + Elasticsearch + Graph + RRF + Reranker 的检索编排，让 Hybrid Retrieval 从“能跑”升级为“可解释、可评估、可观测”的生产形态。

目标链路：

```text
RetrievalService
-> vector retriever
-> keyword retriever
-> graph retriever
-> permission filter
-> RRF
-> reranker
-> context builder
```

## 背景

当前代码已经具备：

- PGVector vector retrieval。
- Elasticsearch BM25 keyword retrieval。
- Graph retrieval。
- RRF fusion。
- Reranker。
- Context Builder。
- Tenant / data permission policy。

但 RetrievalService 中缺少统一的 pipeline breakdown。后续 Evaluation、Observability Workbench、Agent Debug 都需要知道每个阶段的输入数量、输出数量、耗时和跳过原因。

## 禁止项

- 不替换 PGVector。
- 不替换 Elasticsearch。
- 不改 RRF 算法公式。
- 不改 Reranker Provider 协议。
- 不改 Agent Workflow 拓扑。
- 不把权限判断下沉到 Elasticsearch / PGVector 作为唯一权威。
- 不记录完整 query、prompt、answer、chunk content。
- 不新增数据库表。
- 不引入外部 APM。

## 后端要求

新增 Retrieval Pipeline 类型：

```ts
type RetrievalPipelineStage =
  'vector' | 'keyword' | 'graph' | 'permission-filter' | 'rrf' | 'reranker' | 'context-builder';

interface RetrievalStageBreakdown {
  stage: RetrievalPipelineStage;
  status: 'success' | 'failed' | 'skipped';
  durationMs: number;
  inputCount?: number;
  outputCount: number;
  reason?: string;
}

interface RetrievalPipelineBreakdown {
  totalDurationMs: number;
  scopedSpaceCount: number;
  vectorCount: number;
  keywordCount: number;
  graphCount: number;
  filteredCount: number;
  rrfCount: number;
  rerankedCount: number;
  contextCount: number;
  stages: RetrievalStageBreakdown[];
}
```

新增：

```ts
RetrievalService.retrieveWithBreakdown();
```

保留：

```ts
RetrievalService.retrieve();
```

`retrieve()` 继续返回 `ContextChunk[]`，保持 Agent / Chat / Evaluation 旧调用兼容。

## Agent Trace 集成

`RetrievalNode` 调用 retrieval tool 时保存 breakdown 到 `AgentState`。

Execution timeline 的 retrieval event metadata 增加安全字段：

```text
vectorCount
keywordCount
graphCount
filteredCount
rrfCount
rerankedCount
contextCount
retrievalDurationMs
```

不保存 query 和 chunk content。

## Evaluation 更新

Evaluation case result 增加 retrieval breakdown。

Markdown report 增加：

```text
- Retrieval breakdown: vector=x keyword=y graph=z filtered=a rrf=b reranked=c context=d
```

新增或更新 `docs/evaluation/hybrid-retrieval.dataset.example.json`，覆盖：

- vector-only 可命中。
- keyword-only 可命中。
- graph 可参与。
- permission filter 不越权。

## Frontend 更新

Observability timeline 展示 retrieval breakdown。

要求：

- 只在 event.type 或 stage 为 `retrieval` 时展示。
- 展示各阶段 count 和 duration。
- 不展示 query。
- 不展示 chunk content。

## 验收标准

- vector / keyword / graph 都有独立 stage breakdown。
- permission filter 有输入/输出数量。
- RRF 输出数量可见。
- reranker 输出数量可见。
- context builder 输出数量可见。
- tenant / permission filter 仍然生效。
- Agent answer 链路不破。
- Evaluation report 包含 retrieval breakdown。
- Observability timeline 展示 retrieval breakdown。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
