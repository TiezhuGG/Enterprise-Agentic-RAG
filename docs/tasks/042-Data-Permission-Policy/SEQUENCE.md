# TASK-042：流程设计

## Document Read

```text
DocumentController
-> DocumentService.getById(context, documentId)
-> DocumentRepository.findActiveById()
-> KnowledgeSpaceRepository.findAccessibleById(spaceId, userId, tenantId)
-> DocumentRepository.findContentByDocumentId()
-> AccessPolicyService.assertCanReadKnowledgeResource()
-> return Document
```

无权限时：

```text
403 Document access denied
```

## Document Metadata

```text
DocumentService.getMetadata()
-> Space member check
-> load DocumentContent.metadata
-> AccessPolicyService.assertCanReadKnowledgeResource()
-> return metadata only
```

无权限时不返回 metadata。

## Retrieval

```text
RetrievalService.retrieve()
-> tenant-scoped spaces
-> VectorRetriever / KeywordRetriever / GraphRetriever
-> collect raw results
-> load document metadata by documentId
-> AccessPolicyService.filterRetrievalResults()
-> RRF
-> Reranker
-> ContextBuilder
```

策略过滤发生在 RRF 和 Reranker 前。

## Agent Retrieval

```text
Agent RetrievalNode
-> RetrievalTool
-> RetrievalService
-> ContextChunk[]
-> AnswerNode citations
```

由于 `ContextChunk[]` 已经过 policy filter，citation 默认不会包含无权限内容。

## Agent Graph

```text
GraphNode
-> GraphTool
-> GraphRetrievalService.retrieveForContext()
-> tenant-scoped spaces
-> Neo4j query with spaceIds
-> load document metadata
-> AccessPolicyService.filterGraphContexts()
-> GraphContext[]
```

GraphTool 禁止直接构造未收紧的 `RetrievalAccessContext`。

## Department Rule

```text
metadata.allowedDepartmentIds exists
-> context.departmentId must be included
```

或：

```text
metadata.departmentId exists
-> context.departmentId must equal metadata.departmentId
```

例外：

- admin role
- Space OWNER

## Confidential Rule

```text
securityLevel = CONFIDENTIAL
-> allow only Space OWNER / admin / knowledge.confidential.read
```

普通 VIEWER 即使有 Space membership 也不能读取。
