# TASK-057：Codex Prompt

你是 Enterprise Agentic RAG 项目的前端/后端工程师。

请实现 Answer Trust & Citation Deep Link。

必须遵守：

- 先阅读 `SPEC.md`、`SEQUENCE.md`、`ADR.md`、`REVIEW.md`。
- 保持 Component -> Store -> Service -> API。
- 组件禁止直接 `fetch`。
- 不新增复杂检索算法。
- 不展示 prompt、answer 原始调试信息、token、API key、JWT。
- Citation 必须继续依赖后端权限校验。

需要实现：

- Answer Trust 等级计算。
- 统一 citation evidence panel。
- Citation 预览弹窗。
- ChatWindow 和 Agent Debug 接入。
- 历史消息恢复 citations。
- Prompt 增强：无依据时不得编造。

完成后执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

输出：

- 修改文件
- 可信度设计
- Citation deep link 说明
- 测试结果
