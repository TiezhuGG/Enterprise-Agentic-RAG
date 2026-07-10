# TASK-057：Answer Trust & Citation Deep Link

## 目标

增强 AI 回答可信度展示，让用户能明确知道：

- 当前回答是否有依据。
- 依据来自哪些文档和片段。
- 每个引用的 sectionTitle、score、metadata。
- 可以打开引用定位预览，查看命中的片段。

## 范围

本任务以前端可信度体验为主，轻量补强后端 prompt：

- 回答没有依据时必须明确说明“没有找到依据”。
- 不允许无上下文时编造答案。
- 前端展示 Answer Trust：高 / 中 / 低 / 无依据。
- Citation 支持打开来源预览并定位片段。
- 历史会话消息恢复 metadata 中的 citations。

## 新增目录

```text
apps/frontend/components/answer-trust/
apps/frontend/store/answer-trust.store.ts
apps/frontend/types/answer-trust.ts
apps/frontend/lib/answer-trust.ts
```

## UI 要求

- 无 citation 时显示“没有找到依据”。
- 有 citation 时展示来源文档、片段、sectionTitle、score。
- 展示可信度等级和解释原因。
- 支持打开引用预览弹窗。
- 文本类文档尝试在预览中高亮命中片段。
- PDF / IMAGE 可打开原文件预览，同时展示 citation 片段。

## 架构边界

必须：

```text
Component
↓
Store
↓
Service
↓
API
```

禁止：

- 组件直接 `fetch`。
- Citation 绕过权限读取文档。
- 展示完整 prompt。
- 展示 API key / JWT。
- Citation 显示无权限文档内容。

## 验收标准

- ChatWindow 侧栏展示 Answer Trust。
- Agent Debug citation 面板展示 Answer Trust。
- 无引用时有明确“没有找到依据”提示。
- 点击 citation 可打开定位预览。
- 刷新历史会话后 assistant message 仍能展示 citations。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
