# TASK-022 Review Checklist

## Documents

- [ ] SPEC reviewed
- [ ] SEQUENCE reviewed
- [ ] ADR reviewed
- [ ] CODEX prompt matches implementation scope

## Architecture

- [ ] Observability code lives in infrastructure layer
- [ ] Controllers do not access repositories, Prisma, Redis, Neo4j, or providers
- [ ] Business modules only call `ObservabilityService`
- [ ] No external APM dependency introduced

## Correlation

- [ ] HTTP requestId created or read from `x-request-id`
- [ ] requestId stored in `ExecutionContext.metadata`
- [ ] Agent execution logs include executionId
- [ ] Agent node metrics include node and status labels

## Safety

- [ ] No full prompt logging
- [ ] No full answer logging
- [ ] No document content logging
- [ ] No file buffer logging
- [ ] No API key/token logging

## Metrics

- [ ] HTTP counters exist
- [ ] Agent counters exist
- [ ] Retrieval counters exist
- [ ] Graph counters exist
- [ ] LLM counters exist
- [ ] Upload and document processing counters exist
- [ ] Error counter exists

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Smoke confirms `/health`
- [ ] Smoke confirms `/metrics`
