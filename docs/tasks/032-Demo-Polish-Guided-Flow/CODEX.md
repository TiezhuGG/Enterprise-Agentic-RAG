# TASK-032：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的前端工程师。

请实现 Demo Polish & Guided MVP Flow。

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
docs/tasks/032-Demo-Polish-Guided-Flow/SPEC.md
docs/tasks/032-Demo-Polish-Guided-Flow/SEQUENCE.md
docs/tasks/032-Demo-Polish-Guided-Flow/ADR.md
docs/tasks/032-Demo-Polish-Guided-Flow/REVIEW.md
docs/tasks/032-Demo-Polish-Guided-Flow/CODEX.md
```

实现内容：

1. 新增前端类型：

```text
apps/frontend/types/demo.ts
```

2. 新增系统服务：

```text
apps/frontend/services/system.service.ts
```

只调用：

```text
GET /health
GET /metrics
```

3. 新增 demo store：

```text
apps/frontend/store/demo.store.ts
```

4. 新增 demo 组件：

```text
apps/frontend/components/demo/
├── DemoGuidePanel.tsx
├── SystemReadinessPanel.tsx
├── DemoChecklist.tsx
├── DemoQuestionBank.tsx
└── DemoEmptyState.tsx
```

5. 修改 Workbench：

- sidebar 接入 `SystemReadinessPanel`
- 主区域顶部接入 `DemoGuidePanel`
- 三个 tab 保持 `Pipeline / Agent Debug / Assistant`

6. 修改 Agent Debug：

- 接入 `DemoQuestionBank`
- 点击示例问题只填充 question，不自动请求 API

7. 修改空状态和样式：

- Space / Document / Pipeline / Metadata / Agent Debug 状态必须清晰。
- 不展示完整正文。

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
