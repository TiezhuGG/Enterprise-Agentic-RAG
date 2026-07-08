# TASK-033：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的前端工程师。

请实现 Login Panel & Auth UX Completion。

必须遵守：

- 不新增后端 API。
- 不新增独立路由页面。
- 不实现注册、刷新 token、忘记密码。
- 不展示完整 accessToken。
- 不展示 password。
- React 组件不得直接 `fetch`。
- API 调用必须走 `Component -> Store -> Service -> API`。

必须先阅读：

```text
docs/tasks/033-Login-Panel-Auth-UX/SPEC.md
docs/tasks/033-Login-Panel-Auth-UX/SEQUENCE.md
docs/tasks/033-Login-Panel-Auth-UX/ADR.md
docs/tasks/033-Login-Panel-Auth-UX/REVIEW.md
docs/tasks/033-Login-Panel-Auth-UX/CODEX.md
```

实现内容：

1. 新增：

```text
apps/frontend/types/auth.ts
apps/frontend/services/auth.service.ts
```

2. 修改 `workbench.store.ts`：

- `authUser`
- `authLoading`
- `authError`
- `login(email, password)`
- `clearAuth()`

3. 将 `AuthTokenPanel` 升级为 `AuthPanel`：

- 默认 email/password 登录。
- 保留 Manual Token。
- 支持 Logout。

4. 修改 `DemoWorkbench` 使用 `AuthPanel`。

5. 修改 `DemoGuidePanel`：

- Auth step 优先显示 `Logged in as email`。
- Manual Token fallback 显示 `JWT token saved`。

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
- API 说明
- 测试结果
