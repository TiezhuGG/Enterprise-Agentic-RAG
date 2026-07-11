# TASK-062：Sequence

## 读取访问范围

```text
Frontend
-> WorkbenchStore.loadDocumentAccessScope(documentId)
-> DocumentService.getAccessScope(documentId)
-> GET /documents/:id/access-scope
-> DocumentController
-> DocumentService
-> DocumentRepository.findActiveById()
-> ensure Space read role
-> AccessPolicy read check
-> return accessScope
```

## 修改访问范围

```text
Frontend
-> WorkbenchStore.updateDocumentAccessScope()
-> DocumentService.updateAccessScope()
-> PATCH /documents/:id/access-scope
-> DocumentController
-> DocumentService
-> ensure Space OWNER/EDITOR
-> validate tenant/department scope
-> DocumentRepository.updateAccessScope()
-> return normalized accessScope
```

## Processing 继承范围

```text
DocumentProcessingService
-> DocumentRepository.findActiveById()
-> StorageService.getObject()
-> Parser
-> Cleaner
-> DocumentMetadataBuilder.build(document, object, content, cleaningMetadata)
-> merge document.accessScope into DocumentContent.metadata
-> upsert DocumentContent
```

## Chunk 继承范围

```text
ChunkService.processChunks(documentId)
-> read DocumentContent.metadata
-> createChunkMetadata()
-> copy securityLevel / departmentId / allowedDepartmentIds
-> save Chunk
-> sync Search index
```

## Retrieval 权限过滤

```text
RetrievalService
-> vector / keyword / graph results
-> AccessPolicyService.filterRetrievalResults()
-> uses metadata.securityLevel / departmentId / allowedDepartmentIds
-> ContextBuilder
-> Agent / Chat
```

## 错误流程

### 用户无 Space 角色

```text
ensureSpaceRole()
-> NotFound / Forbidden
```

### 用户无文档读取权限

```text
AccessPolicyService.assertCanReadKnowledgeResource()
-> 403 Document access denied
```

### 非 OWNER/EDITOR 修改

```text
PATCH access-scope
-> ensureSpaceRole(writeRoles)
-> 403 Insufficient knowledge space role
```

### 非法安全级别或部门列表

```text
DTO validation
-> 400
```
