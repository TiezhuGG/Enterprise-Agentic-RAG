# TASK-053：Codex Prompt

你是 Enterprise Agentic RAG 项目的前端与后端协作工程师。

请实现 Upload & Ingestion UX Hardening。

## 必须遵守

- 先读 `SPEC.md`、`SEQUENCE.md`、`ADR.md`、`REVIEW.md`。
- 不新增后端领域能力，除非发现现有 API 无法支持刷新闭环。
- React 组件不得直接 fetch。
- 保持 `Component -> Store -> Service -> API`。
- 不展示 prompt、answer、document content、API key。

## 实现重点

- 文档状态中文化。
- Pipeline 阶段中文化。
- 失败原因业务化。
- 上传后自动刷新。
- Ingest 成功和失败后都刷新状态与 pipeline events。

## 验证

必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
