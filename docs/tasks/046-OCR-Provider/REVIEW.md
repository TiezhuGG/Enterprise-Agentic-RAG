# TASK-046：Review Checklist

## 实现前

- [ ] 确认现有多模态附件 schema。
- [ ] 确认 ConfigService env 校验方式。
- [ ] 确认 Chat prompt 只消费 `extractedText`。

## 实现后

- [ ] Controller 未调用 OCR provider。
- [ ] Service 未直接访问 HTTP SDK 以外的 provider 细节。
- [ ] OCR 配置通过 ConfigService 获取。
- [ ] metadata 不包含正文、buffer、密钥。
- [ ] 图片附件失败时状态为 `FAILED`。
- [ ] 本地 metadata fallback 可用。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed`
