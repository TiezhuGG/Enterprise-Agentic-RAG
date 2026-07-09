# TASK-047：Review Checklist

## 实现后

- [ ] AUDIO 使用 `AsrProvider`。
- [ ] 配置只通过 ConfigService 访问。
- [ ] 失败状态正确更新。
- [ ] Chat prompt 不包含音频二进制。
- [ ] metadata 不包含密钥或完整响应原文。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
