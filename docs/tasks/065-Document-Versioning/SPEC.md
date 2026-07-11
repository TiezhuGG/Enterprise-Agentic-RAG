# TASK-065：Document Versioning

## 目标

为知识库文档增加轻量版本管理能力，让用户可以看到同一个 Document 的源文件修订历史，并上传新版本替换当前可检索内容。

本任务的核心定位：

```text
Document = 当前可检索的文档聚合
DocumentVersion = Document 的源文件版本历史
```

上传新版本后，Document 当前文件指向新版本文件，并进入 `PROCESSING`，后续仍复用现有 Ingestion：

```text
Upload New Version
-> DocumentVersion(vN)
-> Document current storageKey/status
-> Ingestion
-> DocumentContent/Chunk/Embedding/Search
```

## 禁止项

- 不实现历史版本全文检索。
- 不实现版本 diff。
- 不实现版本回滚。
- 不实现在线编辑器。
- 不复制历史 `DocumentContent` 正文。
- 不让 Controller 访问 Prisma、MinIO、Search、Vector。
- 不让 Service 直接访问 Prisma。
- 不绕开现有 Space member、Tenant、AccessPolicy。

## 数据库

新增模型：

```prisma
model DocumentVersion {
  id            String         @id @default(cuid())
  documentId    String         @map("document_id")
  versionNumber Int            @map("version_number")
  title         String
  description   String?
  type          DocumentType
  status        DocumentStatus @default(CREATED)
  storageKey    String?        @map("storage_key")
  mimeType      String?        @map("mime_type")
  size          Int?
  sourceHash    String?        @map("source_hash")
  contentHash   String?        @map("content_hash")
  isCurrent     Boolean        @default(false) @map("is_current")
  metadata      Json           @default("{}")
  createdBy     String         @map("created_by")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  document      Document       @relation(fields: [documentId], references: [id], onDelete: Cascade)
  creator       User           @relation(fields: [createdBy], references: [id], onDelete: Restrict)

  @@unique([documentId, versionNumber])
  @@index([documentId, isCurrent])
  @@index([createdBy])
  @@map("document_versions")
}
```

已有文档迁移时回填 v1。

## 后端 API

新增：

```text
GET /documents/:id/versions
GET /documents/:id/versions/:versionId
POST /documents/:id/versions/upload
```

权限：

- 列表/详情：`OWNER / EDITOR / VIEWER` + AccessPolicy read。
- 上传新版本：`OWNER / EDITOR`。
- 新版本上传成功后，Document 状态变为 `PROCESSING`。

## 前端

新增：

```text
components/workbench/DocumentVersionPanel.tsx
```

Workbench store 新增：

- `documentVersions`
- `documentVersionsError`
- `loadingDocumentVersions`
- `uploadingDocumentVersion`
- `loadDocumentVersions(documentId?)`
- `uploadDocumentVersion(file)`

UI 行为：

- 选择 Document 后自动加载版本列表。
- 展示版本号、当前版本、状态、文件类型、大小、上传人、上传时间。
- `OWNER / EDITOR` 可上传新版本。
- 上传新版本后刷新 Document、Version、Pipeline 状态。

## 验收标准

- 旧文档被回填 v1。
- 新上传文档自动创建 v1。
- 上传新版本创建 vN 并设置为 current。
- 旧版本 `isCurrent=false`。
- `GET /documents/:id/versions` 按版本倒序返回。
- 版本 API 受 Space/Tenant/AccessPolicy 保护。
- 前端不直接 `fetch`。
- 现有 Ingestion/Preview/Search/Agent 不被破坏。
