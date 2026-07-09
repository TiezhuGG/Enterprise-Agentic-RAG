# TASK-050：Review Checklist

## 实现后

- [ ] README 中文正常，无乱码。
- [ ] Demo script 可按步骤执行。
- [ ] `demo:seed` 不直接访问 Prisma。
- [ ] `provider:smoke` 不输出 secret。
- [ ] 部署检查清单覆盖 env、docker、db、health、metrics。
- [ ] 简历描述没有夸大未实现能力。
- [ ] 截图清单不要求提交二进制素材。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm provider:smoke`
- [ ] `pnpm demo:seed --no-ingest`
