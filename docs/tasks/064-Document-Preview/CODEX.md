# TASK-064：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Document Preview。

必须先阅读本目录下：

- `SPEC.md`
- `SEQUENCE.md`
- `ADR.md`
- `REVIEW.md`
- `CODEX.md`

## 目标

新增受权限保护的文档预览 API：

```text
GET /documents/:id/preview
```

并在前端工作台展示 parsed content preview。

## 后端要求

- Controller 不访问 Repository / Prisma。
- Service 负责权限和截断。
- Repository 只提供 Document / DocumentContent 数据。
- Preview 必须复用 AccessPolicyService。
- 不返回无限制完整大文档。

## 前端要求

- 新增 `DocumentPreviewPanel`。
- Admin 预览弹窗支持 parsed fallback。
- 组件不直接 `fetch`。
- 保持 Component -> Store -> Service -> API。

## 禁止

- 不实现编辑。
- 不实现批注。
- 不实现版本管理。
- 不新增文件上传。
- 不绕开权限。

## 验证

执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```
