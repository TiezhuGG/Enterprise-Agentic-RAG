# TASK-051 Review Checklist

## 实现前

- [x] 已确认现有 provider smoke 只做配置级检查。
- [x] 已确认 `/health/readiness` 已有基础设施检查。
- [x] 已确认前端 Observability 已展示 readiness checks。

## 实现后

- [ ] `ReadinessCheck` 包含 stage/code/configured/reachable/inference。
- [ ] LLM probe 调用 chat completions 并验证 response shape。
- [ ] Embedding probe 调用 embeddings 并验证 dimension。
- [ ] Reranker probe 调用 rerank 并验证 score/index。
- [ ] provider smoke 报告不输出敏感内容。
- [ ] provider 异常抛出统一 code/message。
- [ ] 前端 API error 能读取 code/message。
- [ ] 前端 readiness 面板展示中文 message/code/stage。

## 验证命令

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm provider:smoke
```

如本地模型服务未启动，`provider:smoke` 可以返回 degraded，但必须指出 LLM/Embedding/Reranker 的中文失败原因。
