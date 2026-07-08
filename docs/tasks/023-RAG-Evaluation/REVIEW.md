# TASK-023 Review Checklist

## 文档

- [ ] SPEC 已生成
- [ ] SEQUENCE 已生成
- [ ] ADR 已生成
- [ ] CODEX 已生成
- [ ] README / docs/evaluation 已更新

## 架构

- [ ] EvaluationService 不直接访问 Prisma
- [ ] EvaluationService 不直接访问 VectorClient
- [ ] EvaluationService 不直接访问 Neo4j / GraphService
- [ ] EvaluationService 不直接访问 Repository
- [ ] Evaluation 只调用 RetrievalService / AgentService

## Dataset

- [ ] 支持 defaultContext
- [ ] 支持 per-case context override
- [ ] 支持 expectedAnswer
- [ ] 支持 expectedCitationChunkIds
- [ ] 支持 expectedCitationDocumentIds
- [ ] 支持 conversationId 可选

## Metrics

- [ ] retrievalRecall
- [ ] citationCoverage
- [ ] answerExpectedTermCoverage
- [ ] answerGroundedness
- [ ] summary averages

## 输出

- [ ] JSON report
- [ ] Markdown report
- [ ] 不输出完整文档内容
- [ ] case 失败不影响后续 case

## 验证

- [ ] pnpm format:check
- [ ] pnpm lint
- [ ] pnpm typecheck
- [ ] pnpm build
- [ ] smoke 生成 report
