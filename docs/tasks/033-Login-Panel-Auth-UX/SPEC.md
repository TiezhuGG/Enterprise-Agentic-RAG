# TASK-033：Login Panel & Auth UX Completion

## 目标

补齐前端登录闭环。

当前 Demo Workbench 只能手动粘贴 JWT Token，对演示用户不够直观。TASK-033 在现有侧边栏中加入 email/password 登录面板，调用后端已有 `POST /auth/login`，登录成功后自动保存 `accessToken`，并刷新 Space / Document / Checklist。

演示路径升级为：

```text
Login -> System Ready -> Space -> Upload -> Ingest -> Agent Debug -> Assistant
```

## 范围

新增：

```text
docs/tasks/033-Login-Panel-Auth-UX/
├── SPEC.md
├── SEQUENCE.md
├── ADR.md
├── REVIEW.md
└── CODEX.md

apps/frontend/types/auth.ts
apps/frontend/services/auth.service.ts
```

修改：

```text
apps/frontend/components/workbench/AuthPanel.tsx
apps/frontend/components/workbench/DemoWorkbench.tsx
apps/frontend/store/workbench.store.ts
apps/frontend/components/demo/DemoGuidePanel.tsx
apps/frontend/app/globals.css
```

## API

复用现有：

```text
POST /auth/login
```

请求：

```ts
{
  email: string;
  password: string;
}
```

响应：

```ts
{
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    spaceIds: string[];
    metadata: Record<string, unknown>;
  };
}
```

## UI

将 `AuthTokenPanel` 升级为 `AuthPanel`：

- 默认展示 email/password 登录。
- 推荐占位为 `admin@example.com / password`。
- 保留 `Manual Token` 折叠区域。
- 登录成功后自动保存 token。
- 登录成功后刷新 Space / Document / Checklist。
- Logout 清空 token 和工作台业务状态。

## Store

`workbench.store.ts` 新增：

- `authUser`
- `authLoading`
- `authError`
- `login(email, password)`
- `clearAuth()`

`clearAuth()` 必须清空：

- localStorage token
- auth user
- spaces
- documents
- selected space/document
- pipeline jobs/events
- metadata
- ingestion state

## 禁止项

- 不新增后端 API。
- 不实现注册。
- 不实现刷新 token。
- 不实现忘记密码。
- 不实现 RBAC 管理。
- 不展示 password。
- 不在 UI 中展示完整 accessToken。
- React 组件不得直接 `fetch`。

## 验收标准

- 未登录时 Auth checklist 为 blocked。
- 可以输入 email/password 登录。
- 登录成功后 token 自动保存。
- 登录成功后 Space 列表自动加载。
- Manual Token 保存仍可用。
- Logout 后业务状态清空。
- 错误密码显示短错误。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
