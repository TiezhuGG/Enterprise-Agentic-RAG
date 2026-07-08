# TASK-033：Review Checklist

## 实现前

- [ ] 已确认后端存在 `POST /auth/login`。
- [ ] 已确认登录响应包含 `accessToken`。
- [ ] 已确认 token 存储使用现有 `api-client`。

## 实现中

- [ ] 新增 `types/auth.ts`。
- [ ] 新增 `services/auth.service.ts`。
- [ ] `workbench.store.ts` 增加 `login()`。
- [ ] `workbench.store.ts` 增加 `clearAuth()`。
- [ ] `AuthTokenPanel` 升级为 `AuthPanel`。
- [ ] Manual Token 仍可用。
- [ ] 登录错误不泄露 password/token。
- [ ] DemoGuide Auth step 优先显示 user email。
- [ ] 未登录时不请求 `/spaces`。

## 实现后

- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。
- [ ] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store` 无结果。

## Smoke

- [ ] 未登录时 Auth checklist 为 blocked。
- [ ] 使用 `admin@example.com / password` 可登录。
- [ ] 登录后 Space 自动加载。
- [ ] Logout 后业务状态清空。
- [ ] Manual Token 保存后可加载 Space。
- [ ] 错误密码显示短错误。
