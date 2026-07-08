# TASK-022 Observability SPEC

## Goal

Implement production observability for the Enterprise Agentic RAG backend.

Observability must cover:

- HTTP request lifecycle
- Agent workflow execution
- Agent node trace
- Retrieval / Graph retrieval counts
- LLM request and token counts
- Upload and document processing outcomes
- Health and metrics endpoints

---

## Architecture

Create:

```text
apps/backend/src/infrastructure/observability/
```

Files:

```text
observability.module.ts
observability.service.ts
observability.interceptor.ts
observability.controller.ts
observability.types.ts
index.ts
```

The module belongs to infrastructure.

Business modules may only depend on `ObservabilityService`.

---

## APIs

Add:

```text
GET /health
GET /metrics
```

`GET /health` response:

```ts
{
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}
```

`GET /metrics` response:

```text
Prometheus-compatible text exposition
```

---

## Required Correlation

Every HTTP request must have:

```text
requestId
```

Agent executions must include:

```text
requestId
executionId
```

These identifiers must be propagated through:

```text
HTTP -> Controller -> ExecutionContext.metadata -> AgentService -> AgentGraph -> Nodes
```

---

## Metrics

Track at minimum:

```text
http_requests_total
http_request_duration_ms
agent_workflows_total
agent_workflow_duration_ms
agent_node_duration_ms
retrieval_requests_total
retrieval_results_total
graph_retrieval_requests_total
graph_retrieval_results_total
llm_requests_total
llm_stream_tokens_total
upload_requests_total
document_processing_total
errors_total
```

---

## Logging

Logs must be structured JSON.

Log fields:

```ts
{
  timestamp,
  level,
  event,
  requestId?,
  executionId?,
  userId?,
  durationMs?,
  status?,
  metadata?,
  error?
}
```

---

## Forbidden

Do not:

- introduce external APM
- log full prompts
- log full LLM answers
- log document content
- log uploaded file buffers
- log auth tokens or API keys
- let controllers call metrics/logging internals beyond normal service use

---

## Validation

Must pass:

```text
pnpm lint
pnpm typecheck
pnpm build
```

Smoke:

- `/health` returns ok
- `/metrics` includes agent/retrieval/llm counters
- `/agent/chat/stream` emits events and records requestId/executionId
- error flow increments `errors_total`
