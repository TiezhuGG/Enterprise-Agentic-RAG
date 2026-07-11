# TASK-064：Review Checklist

## 实现前

- [x] 阅读 DocumentService。
- [x] 阅读 DocumentRepository。
- [x] 阅读 DocumentController。
- [x] 阅读 Admin 现有 preview dialog。
- [x] 阅读 frontend document.service。

## 实现后

- [x] 后端新增 DocumentPreviewResponse。
- [x] Service 实现 getPreview。
- [x] Controller 暴露 `GET /documents/:id/preview`。
- [x] Preview 复用 AccessPolicy。
- [x] Preview 支持 maxChars 截断。
- [x] 前端类型增加 preview response。
- [x] 前端 service 增加 getPreview。
- [x] Workbench store 增加 preview state/actions。
- [x] 新增 DocumentPreviewPanel。
- [x] Admin preview dialog fallback 到 parsed preview。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store`

## Smoke

- [ ] READY 文档可看到 parsed preview。
- [ ] 未解析文档 parsed unavailable。
- [ ] PDF 原文件仍可预览。
- [ ] TXT/Markdown 可预览文本。
- [ ] 不支持原文件预览时 fallback 到 parsed preview。
- [ ] 无权限用户无法 preview。

> 说明：本轮完成了静态验证和构建验证；Smoke 需要启动后端、前端并准备带权限的示例文档后执行。
