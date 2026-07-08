# TASK-022 Observability Sequence

## HTTP Request Flow

```text
Client
↓
Nest HTTP
↓
ObservabilityInterceptor
↓
requestId created or read from x-request-id
↓
request.requestId assigned
↓
Controller
↓
Service
↓
Response
↓
ObservabilityInterceptor records:
  http_requests_total
  http_request_duration_ms
  structured request log
```

## Agent Flow

```text
AgentController
↓
RequestContextService
↓
ExecutionContext.metadata.requestId
↓
AgentService.execute / executeStream
↓
AgentGraph
↓
Nodes
↓
ObservabilityService records:
  agent_workflows_total
  agent_workflow_duration_ms
  agent_node_duration_ms
  token counters
```

## Retrieval Flow

```text
RetrievalService.retrieve
↓
Vector + Keyword + optional Graph
↓
RRF
↓
Reranker
↓
ContextBuilder
↓
ObservabilityService records:
  retrieval_requests_total
  retrieval_results_total
  retrieval duration
```

## Graph Retrieval Flow

```text
GraphRetrievalService.retrieve
↓
EntityExtractor
↓
KnowledgeGraphRepository
↓
GraphService
↓
ObservabilityService records graph retrieval count and result count
```

## Error Flow

```text
Any observed operation throws
↓
ObservabilityService increments errors_total
↓
Structured error log records safe error metadata
↓
Original error is rethrown
```

## Streaming Flow

```text
POST /agent/chat/stream
↓
AgentService.executeStream
↓
AgentGraph node events
↓
token events
↓
citation events
↓
done or error
↓
Observability records token count, workflow status, and error status
```
