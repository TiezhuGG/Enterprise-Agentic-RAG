# TASK-022 Observability Implementation

You are the backend engineer for the Enterprise Agentic RAG project.

Strictly follow DDD and infrastructure boundaries.

## Goal

Implement production observability.

Add:

```text
apps/backend/src/infrastructure/observability/
```

Expose:

```text
GET /health
GET /metrics
```

## Requirements

Implement:

- requestId correlation
- executionId correlation
- structured JSON logs
- in-memory metrics registry
- Prometheus-compatible metrics output
- Agent workflow metrics
- Agent node trace metrics
- Retrieval metrics
- Graph retrieval metrics
- LLM request/token metrics
- Upload metrics
- Document processing metrics
- error metrics

## Rules

Do not:

- introduce external APM
- log full prompt
- log full answer
- log document content
- log uploaded buffers
- log tokens or API keys
- let Controller access Repository, Prisma, Redis, Neo4j, or Provider

Must preserve:

```text
Controller -> Service -> Infrastructure
AgentService -> AgentGraph -> Nodes
```

## Validation

Run:

```text
pnpm lint
pnpm typecheck
pnpm build
```

Smoke:

- `/health` returns ok
- `/metrics` contains agent/retrieval/llm counters
- stream errors increment error metric

## Output

Return:

- new docs
- new infrastructure files
- API summary
- metrics summary
- validation results
