# TASK-062：Codex Prompt

你是 Enterprise Agentic RAG 项目的后端与前端工程师。

请实现 Document Access Scope。

必须先阅读本目录下：

- `SPEC.md`
- `SEQUENCE.md`
- `ADR.md`
- `REVIEW.md`
- `CODEX.md`

然后再写代码。

## 实现要求

新增文档级访问范围：

- `securityLevel`
- `departmentId`
- `allowedDepartmentIds`

将配置持久化到 `Document.accessScope`。

新增 API：

```text
GET /documents/:id/access-scope
PATCH /documents/:id/access-scope
```

修改 `DocumentMetadataBuilder`：

- 从 `Document.accessScope` 写入 `DocumentContent.metadata`。

保持既有链路：

```text
Controller -> Service -> Repository -> Prisma
```

前端保持：

```text
Component -> Store -> Service -> API
```

## 禁止

- Controller 不访问 Repository/Prisma。
- Component 不直接 fetch。
- 不实现 Document Versioning。
- 不实现 Tags。
- 不实现 Department CRUD。
- 不绕开 AccessPolicyService。

## 验证

执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```
