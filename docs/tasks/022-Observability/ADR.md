# ADR-022 Observability

## Status

Accepted

## Context

The project now has Agent API, streaming UI, Retrieval, GraphRAG, Memory, Upload, and Document Processing.

Production operation needs request correlation, metrics, safe structured logs, and health endpoints before adding evaluation, deployment packaging, and multimodal input.

## Decision

Implement observability as an infrastructure module:

```text
apps/backend/src/infrastructure/observability
```

Use an in-memory metrics registry and JSON console logging for the first version.

Expose:

```text
GET /health
GET /metrics
```

Use a Nest interceptor for HTTP request correlation and metrics.

Business services may call `ObservabilityService`, but must not own metrics storage or log formatting.

## Rationale

This keeps external dependency count low and preserves DDD boundaries.

Prometheus-compatible text makes `/metrics` deployable later without binding this task to a specific observability stack.

## Consequences

Pros:

- consistent requestId and executionId
- safe structured logs
- low operational dependency cost
- metrics available before deployment packaging

Tradeoffs:

- in-memory metrics reset on restart
- no distributed tracing backend yet
- log shipping remains a deployment concern
