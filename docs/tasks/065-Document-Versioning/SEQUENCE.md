# TASK-065：Sequence

## 初始上传流程

```text
User
-> UploadController
-> UploadService.validateFile
-> ensure Space role OWNER/EDITOR
-> DocumentRepository.create
-> StorageService.uploadObject
-> DocumentRepository.createNextVersion(v1, isCurrent=true)
-> DocumentRepository.update Document storageKey/status=PROCESSING
-> return Document
```

## 上传新版本流程

```text
User
-> POST /documents/:id/versions/upload
-> UploadController
-> UploadService.uploadDocumentVersion
-> DocumentRepository.findActiveById
-> ensure Space role OWNER/EDITOR
-> validate file
-> StorageService.uploadObject
-> DocumentRepository.createNextVersion(vN)
   -> old current versions isCurrent=false
   -> create new version isCurrent=true
-> DocumentRepository.update Document current fields/status=PROCESSING
-> return version + document
```

## Ingestion 后状态同步

```text
DocumentProcessing/Ingestion
-> DocumentRepository.update(document.status)
-> if status changed:
   update current DocumentVersion.status
   update current DocumentVersion.contentHash/sourceHash when available
```

第一版只保证 current version 状态跟随 Document，不为历史版本复制 `DocumentContent.content`。

## 列表版本流程

```text
User
-> GET /documents/:id/versions
-> DocumentService.findActiveDocument
-> ensure Space role OWNER/EDITOR/VIEWER
-> AccessPolicy read check
-> DocumentRepository.listVersions
-> return versions
```

## 错误流程

- 无文档：返回 `404 Document not found`。
- 无空间权限：返回 `403 Insufficient knowledge space role`。
- 无 AccessPolicy 读权限：返回策略错误。
- 上传空文件：返回 `400 Upload file is empty`。
- 文件类型不支持：返回 `UNSUPPORTED_FILE_TYPE`。
- Storage 失败：DocumentVersion 不切换 current，Document 不进入新版本状态。
