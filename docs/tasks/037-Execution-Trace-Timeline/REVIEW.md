# TASK-037：Review Checklist

## 实现前

- [ ] 已确认当前 AgentGraph 已迁移到 LangGraph runtime。
- [ ] 已确认 PipelineJob/PipelineEvent 仅作为参考，不复用。
- [ ] 已确认 Execution 模块不会让 Controller 或 Node 访问 Prisma。
- [ ] 已确认 metadata 白名单策略。

## 实现后

- [ ] 新增 Prisma 模型和 migration。
- [ ] 新增 execution module / controller / service / repository / types。
- [ ] API 受 JwtAuthGuard 保护。
- [ ] 用户不能查询其他人的 execution。
- [ ] AgentService 创建和结束 ExecutionRun。
- [ ] AgentGraph 节点执行后写入 ExecutionTraceEvent。
- [ ] 失败流程能写入 FAILED run 和 error event。
- [ ] metadata 不包含 prompt、answer、document content、token 原文。
- [ ] `/executions/:executionId/timeline` 按 sequence 升序返回。
- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。
- [ ] `pnpm db:validate` 通过。
- [ ] `pnpm db:migrate` 成功或 migration 文件可用。
- [ ] `pnpm db:seed` 通过。

## 风险点

- AgentGraph 写事件时不能阻塞或破坏原执行流程。
- 失败路径必须尽量 finish run，但不能吞掉原错误。
- metadata sanitization 必须默认保守。
- 新增数据库关系不能影响现有 seed。
