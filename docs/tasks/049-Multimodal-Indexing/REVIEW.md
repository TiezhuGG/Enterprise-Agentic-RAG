# TASK-049：Review Checklist

## 实现后

- [ ] Ingestion 支持 IMAGE/AUDIO/VIDEO。
- [ ] ParserFactory 注册三类多模态 parser。
- [ ] Upload MIME 白名单支持常见图片、音频、视频。
- [ ] Provider 输出进入 DocumentContent。
- [ ] Chunk/Embedding/Retrieval 不直接读取 MinIO。
- [ ] tenant/access-policy 未绕过。

## 验证

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`
- [ ] 多模态文档 ingest smoke
