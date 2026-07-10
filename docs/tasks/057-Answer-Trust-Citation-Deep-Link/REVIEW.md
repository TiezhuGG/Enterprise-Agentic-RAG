# TASK-057：Review Checklist

## 实现前

- [x] 阅读 AgentCitation 类型。
- [x] 阅读 ChatWindow / CitationPanel。
- [x] 阅读 AgentCitationInspector。
- [x] 阅读 Document preview service。
- [x] 阅读 PromptBuilder / prompt templates。

## 实现后

- [x] 新增 5 个任务文档。
- [x] 新增 Answer Trust 类型和工具函数。
- [x] 新增 AnswerTrustStore。
- [x] 新增 AnswerTrustPanel / CitationEvidencePanel。
- [x] ChatWindow 接入 AnswerTrustPanel。
- [x] Agent Debug 接入统一 citation panel。
- [x] 历史消息恢复 metadata.citations。
- [x] Prompt 明确无依据不编造。
- [x] 组件不直接 `fetch`。
- [x] Citation 预览不泄露无权限内容。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`

## Smoke

- [ ] 有 citation 的回答显示可信度。
- [ ] 无 citation 时显示“没有找到依据”。
- [ ] 点击 citation 可打开预览弹窗。
- [ ] 文本类文档可高亮片段。
- [ ] 历史 assistant message 仍展示 citations。
