# TASK-048：Review Checklist

## 实现后

- [ ] Prisma enum 支持 VIDEO。
- [ ] 多模态 MIME 校验支持 video。
- [ ] VIDEO 使用 provider，不走 Agent。
- [ ] metadata 安全。
- [ ] 失败状态正确。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed`
