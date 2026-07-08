# TASK-031：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的前端工程师。

请实现 Agent Debug Workbench。

必须遵守：

- 严格遵守现有目录结构。
- 不新增后端 API。
- 不修改 AgentGraph / Node 编排逻辑。
- 不引入大型 UI 组件库。
- React 组件不得直接 `fetch`。
- API 调用必须走 `Component -> Store -> Service -> API`。
- 不展示完整 prompt。
- 不展示 Memory 原文。
- 不展示完整 DocumentContent。

必须先阅读：

```text
docs/tasks/031-Agent-Debug-Workbench/SPEC.md
docs/tasks/031-Agent-Debug-Workbench/SEQUENCE.md
docs/tasks/031-Agent-Debug-Workbench/ADR.md
docs/tasks/031-Agent-Debug-Workbench/REVIEW.md
docs/tasks/031-Agent-Debug-Workbench/CODEX.md
```

实现内容：

1. 扩展 `apps/frontend/types/agent.ts`
   - `GraphEventData`
   - `CitationEventData`
   - `DoneEventData`

2. 新增 `apps/frontend/store/agent-debug.store.ts`
   - 管理 conversations、question、runConfig、events、execution summary、trace、citations、answer、error。
   - 调用 `conversationService` 和 `agentService.streamChat()`。
   - 默认运行参数为 `limit=8`、`vectorLimit=8`、`keywordLimit=8`、`maxContextTokens=3000`。

3. 新增组件：

```text
apps/frontend/components/agent-debug/
├── AgentDebugWorkbench.tsx
├── AgentRunForm.tsx
├── AgentExecutionSummary.tsx
├── AgentEventTimeline.tsx
├── AgentTraceTimeline.tsx
├── AgentTokenStream.tsx
└── AgentCitationInspector.tsx
```

4. 修改 `DemoWorkbench`
   - 增加 `Agent Debug` tab。
   - tab 顺序为 `Pipeline / Agent Debug / Assistant`。

5. 修改 `globals.css`
   - 增加 Agent Debug 布局、表单、summary、timeline、token stream、citation inspector 样式。
   - 保证桌面与移动视口不重叠。

验证：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```

输出：

- 修改文件
- 新组件
- API 说明
- 测试结果
