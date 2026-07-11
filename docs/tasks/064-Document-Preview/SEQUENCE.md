# TASK-064：Sequence

## Parsed Preview

```text
Frontend
-> WorkbenchStore.loadDocumentPreview(documentId)
-> DocumentService.getPreview(documentId)
-> GET /documents/:id/preview
-> DocumentController
-> DocumentService
-> DocumentRepository.findActiveById()
-> DocumentRepository.findContentByDocumentId()
-> ensure Space read role
-> AccessPolicy read check
-> slice content by maxChars
-> return preview response
```

## Original File Preview

```text
Admin preview dialog
-> DocumentService.getPreview()
-> DocumentService.preview(document)
-> GET /documents/:id/file?disposition=inline
-> StorageService.getObject()
-> Blob URL
-> iframe/img/pre
```

## 无解析内容

```text
Document.status = CREATED / PROCESSING / FAILED
or DocumentContent missing
-> parsedContent.available = false
-> file.available depends on storageKey
```

## 权限失败

```text
DocumentService.getPreview()
-> ensureSpaceRole()
-> AccessPolicyService.assertCanReadKnowledgeResource()
-> 403 Document access denied
```

## 截断逻辑

```text
contentLength > maxChars
-> content = content.slice(0, maxChars)
-> truncated = true
```

## 前端展示

```text
DocumentPreviewPanel
-> selectedDocumentId changes
-> loadDocumentPreview()
-> render parsed content / empty state / error state
```
