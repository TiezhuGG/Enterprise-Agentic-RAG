# TASK-052：Codex Prompt

你是 Enterprise Agentic RAG 项目的后端工程师。

请实现 Demo Dataset Bootstrap。

## 必须遵守

- 先读 `SPEC.md`、`SEQUENCE.md`、`ADR.md`、`REVIEW.md`。
- 严格保持现有 DDD 边界。
- demo 脚本优先复用 Service，不绕过业务规则。
- reset 只能处理 demo 命名空间。
- 不输出 secret、prompt、answer、完整文档正文。

## 实现目标

增强：

```bash
pnpm demo:seed
pnpm demo:seed --reset
pnpm demo:seed --no-ingest
pnpm demo:seed --graph
pnpm demo:reset
```

生成：

- demo user
- demo enterprise context
- demo knowledge space
- 多份 sample document
- 可选 ingestion
- demo conversation
- demo questions
- smoke commands

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

推荐执行：

```bash
pnpm demo:seed --reset --no-ingest
pnpm demo:seed --reset --no-graph
```
