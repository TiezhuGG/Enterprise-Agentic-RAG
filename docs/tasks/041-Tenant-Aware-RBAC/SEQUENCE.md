# TASK-041：流程设计

## Space 列表流程

```text
HTTP Request
-> JwtStrategy
-> RequestContextService
-> KnowledgeSpaceController
-> KnowledgeSpaceService.list(context)
-> KnowledgeSpaceRepository.listForUser(userId, tenantId)
-> Prisma tenant filter + member filter
-> Space[]
```

## Space 详情 / 更新 / 删除流程

```text
HTTP Request
-> ExecutionContext
-> KnowledgeSpaceService
-> KnowledgeSpaceRepository.findAccessibleById(spaceId, userId, tenantId)
-> member role check
-> action
```

错误流程：

- Space 不属于当前 tenant：返回 `Knowledge space not found`。
- Space 属于当前 tenant 但用户不是成员：返回 `Knowledge space not found`。
- 用户是成员但 role 不足：返回 `Insufficient knowledge space role`。

## Document 读写流程

```text
DocumentController / UploadController / PipelineController
-> Service
-> KnowledgeSpaceRepository.findAccessibleById(spaceId, userId, tenantId)
-> role check
-> DocumentRepository / StorageService / PipelineRepository
```

DocumentRepository 不承担 tenant 判断，tenant 边界由 Space 聚合根入口保证。

## Retrieval 流程

```text
Agent / Chat / Evaluation
-> RetrievalService.retrieve(context, request)
-> KnowledgeSpaceService.listAccessibleSpaceIds(context)
-> intersect(context.spaceIds, tenantScopedSpaceIds)
-> ContextBuilder.build(scopedContext)
-> VectorRetriever / KeywordRetriever / GraphRetriever
-> RRF
-> Reranker
-> ContextBuilder.buildContextChunks()
```

当 `context.spaceIds` 为空时，默认使用当前 tenant 下用户可访问的所有 Space。

当 `context.spaceIds` 非空时，只保留当前 tenant 下也可访问的交集。

## Graph Retrieval 流程

```text
GraphRetriever
-> GraphRetrievalService.retrieve(query, scopedAccessContext, limit)
-> EntityExtractor
-> KnowledgeGraphRepository.searchByEntityNames(spaceIds, entityNames, limit)
-> Neo4j query with spaceIds filter
```

spaceIds 已经由 RetrievalService 收紧，Neo4j 查询仍保留 spaceId filter 作为第二层保护。

## Seed 回填流程

```text
db:seed
-> upsert default tenant/org/department
-> assign admin tenant/org/department
-> backfill admin legacy spaces tenantId
```

回填只覆盖：

- `tenantId = null`
- admin 是 owner 或 member

不回填其他用户未知归属的数据。
