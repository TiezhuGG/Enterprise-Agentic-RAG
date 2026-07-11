# TASK-070 Review Checklist

## 实现前

- [ ] 已阅读 `app-error-codes.ts`。
- [ ] 已阅读 `api-client.ts`。
- [ ] 已阅读 `workbench-copy.ts`。
- [ ] 已确认不新增业务能力。
- [ ] 已确认不新增数据库表。

## 后端

- [ ] 所有 `AppErrorCode` 都有中文 message。
- [ ] `createAppErrorResponse()` 输出标准结构兼容旧调用。
- [ ] `getAppErrorResponse()` 能读取标准错误。
- [ ] `AppExceptionFilter` 不泄露敏感信息。
- [ ] `main.ts` 注册全局异常过滤器。
- [ ] 新增 `error:smoke`。

## 前端

- [ ] `api-client.ts` 不再维护重复错误文案表。
- [ ] `workbench-copy.ts` 中文乱码被修复。
- [ ] store fallback 改为统一中文文案。
- [ ] 组件、app、store 无直接 `fetch`。
- [ ] 错误提示不展示 token、key、password。

## 验证

- [ ] `pnpm error:smoke`
- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`

## 人工检查

- [ ] 不改变现有 API 成功响应。
- [ ] 不改变 Agent SSE event wire shape。
- [ ] 不影响 readiness/metrics。
- [ ] 不把 provider 原始长错误直接暴露给前端。
- [ ] 中文文案适合演示，不像开发日志。
