# TASK-063：Codex Prompt

你是 Enterprise Agentic RAG 项目的开发工程师。

请实现 Department / Project / Customer Space Type。

必须先阅读：

- `SPEC.md`
- `SEQUENCE.md`
- `ADR.md`
- `REVIEW.md`
- `CODEX.md`

## 实现目标

给 Knowledge Space 增加：

```ts
type: 'GENERAL' | 'DEPARTMENT' | 'PROJECT' | 'CUSTOMER'
metadata: {
  departmentId?: string;
  projectCode?: string;
  projectName?: string;
  customerCode?: string;
  customerName?: string;
  ownerDepartmentId?: string;
}
```

## 后端要求

- 修改 Prisma schema。
- 新增 migration。
- 更新 entity / DTO / repository / service。
- 保持 Controller -> Service -> Repository -> Prisma。
- 不让 Space type 参与权限判断。

## 前端要求

- 创建 Space 时可以选择 type。
- 展示当前 Space type。
- 支持编辑当前 Space profile。
- 保持 Component -> Store -> Service -> API。

## 禁止

- 不实现 Project CRUD。
- 不实现 Customer CRUD。
- 不实现 Department CRUD。
- 不改 Retrieval 权限策略。
- 不让组件直接 fetch。

## 验证

执行：

```bash
pnpm db:validate
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```
