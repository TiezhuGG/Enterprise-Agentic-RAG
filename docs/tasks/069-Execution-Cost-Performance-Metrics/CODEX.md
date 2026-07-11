# TASK-069：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Execution Cost & Performance Metrics。

## 必须实现

- 先生成 5 个中文任务文档。
- 新增可选成本配置：
  - `COST_CURRENCY`
  - `COST_LLM_INPUT_PER_1K`
  - `COST_LLM_OUTPUT_PER_1K`
  - `COST_EMBEDDING_PER_1K`
- 新增 token estimator。
- AnswerNode 记录 prompt/output/total token 与 estimated cost。
- ExecutionTraceEvent metadata 只保存安全数字与模型名。
- Ops Summary 新增：
  - `cost`
  - `performance`
- 前端 Ops Console 新增 Cost & Performance panel。
- 更新 `ops:smoke` 校验 cost/performance。

## 禁止

- 不新增数据库表。
- 不调用外部 Billing API。
- 不记录 prompt、answer、document content、token 原文。
- Controller 不访问 Repository / Prisma。
- 前端组件、app、store 不直接 `fetch`。

## 验证

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm ops:smoke
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```

## 输出

完成后输出：

- 修改文件列表
- 成本估算说明
- 性能指标说明
- 前端展示说明
- 真实 smoke 结果
- 自审结论
