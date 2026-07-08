# TASK-028：Review Checklist

## 实现前检查

- [ ] 已阅读 `SPEC.md`、`SEQUENCE.md`、`ADR.md`。
- [ ] 确认本任务只做 Document Metadata 与 Chunk Metadata 传播。
- [ ] 确认不实现 Pipeline Event / Job。
- [ ] 确认不实现 OCR / ASR / page number。
- [ ] 确认不修改 Retrieval ranking 和 Agent prompt。
- [ ] 确认不让 Controller 访问 Repository / Prisma。
- [ ] 确认不让 Service 直接访问 Prisma。

## Prisma 检查

- [ ] `DocumentContent` 新增 `metadata Json @default("{}")`。
- [ ] 新增 migration。
- [ ] `pnpm db:validate` 通过。

## Metadata 类型检查

- [ ] 定义 `DocumentContentMetadata`。
- [ ] 定义 `DocumentContentLanguage`。
- [ ] 定义 `DocumentSecurityLevel`。
- [ ] Cleaner metadata 类型复用 TASK-027 的结构。
- [ ] metadata 中不包含正文。

## Processing 检查

- [ ] `DocumentProcessingService` 在 Cleaner 后生成 metadata。
- [ ] `sourceHash` 基于原始 object buffer。
- [ ] `contentHash` 基于 cleaned content。
- [ ] `securityLevel` 默认 `INTERNAL`。
- [ ] `language` 不调用 LLM。
- [ ] `upsertContent()` 同时保存 content 和 metadata。
- [ ] 失败时仍设置 Document 为 `FAILED`。

## Repository 检查

- [ ] `DocumentRepository.upsertContent()` 签名包含 metadata。
- [ ] `DocumentRepository.findContentByDocumentId()` 返回 metadata。
- [ ] Repository 内部处理 Prisma JSON 到领域类型的映射。

## API 检查

- [ ] 新增 `GET /documents/:id/metadata`。
- [ ] Controller 只调用 `DocumentService`。
- [ ] 权限复用 Document 读权限。
- [ ] 返回值不包含 `content`。
- [ ] 未生成 content 时返回 NotFound。

## Chunk 检查

- [ ] `ChunkMetadata` 保留 `documentId / sequence / sectionTitle`。
- [ ] `ChunkMetadata` 新增 `spaceId / documentType / language / securityLevel / sourceHash / contentHash`。
- [ ] `ChunkService.processChunks()` 从 `DocumentContent.metadata` 读取并传播。
- [ ] Keyword Retrieval 仍能解析 chunk metadata。

## 验证命令

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm db:validate`

## 可选 Smoke

- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed`
- [ ] `pnpm demo:ingest <documentId> <userId> <spaceId> --force --no-graph`

## 实现后结论

- [ ] 本任务没有破坏现有 Ingestion / Chunk / Embedding / Retrieval / Agent 流程。
- [ ] Metadata 不泄露正文。
- [ ] 后续 TASK-029 可以基于本任务继续做 Pipeline Event / Job。
