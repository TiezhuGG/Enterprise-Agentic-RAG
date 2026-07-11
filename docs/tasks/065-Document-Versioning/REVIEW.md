# TASK-065：Review Checklist

## 实现前

- [x] 阅读 DocumentService。
- [x] 阅读 DocumentRepository。
- [x] 阅读 UploadService。
- [x] 阅读 DocumentController/UploadController。
- [x] 阅读 Workbench store 和 document service。

## 实现后

- [x] Prisma 新增 DocumentVersion。
- [x] Migration 创建表并回填 v1。
- [x] Repository 增加 version create/list/find 能力。
- [x] UploadService 初始上传创建 v1。
- [x] UploadService 支持上传新版本。
- [x] Document 状态同步到 current version。
- [x] Controller 暴露版本 API。
- [x] 前端类型/service/store 接入版本。
- [x] 新增 DocumentVersionPanel。
- [x] Workbench 选择文档后加载版本。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `pnpm db:validate`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

## Smoke

- [ ] 旧文档存在 v1。
- [ ] 新文档上传后存在 v1。
- [ ] 上传新版本后出现 v2。
- [ ] 只有 v2 是 current。
- [ ] Document 状态变为 PROCESSING。
- [ ] Ingestion 成功后 current version 变为 READY。
- [ ] VIEWER 无法上传新版本。

> 说明：本轮先完成代码级验证；Smoke 需要启动后端、前端和真实存储后执行。
