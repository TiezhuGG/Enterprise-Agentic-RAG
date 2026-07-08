# TASK-042：架构决策记录

## ADR-001：新增 AccessPolicyModule，而不是把权限写进 Retrieval 或 Document

### 决策

新增 `modules/access-policy`，集中处理知识数据权限判断。

### 原因

Document、Retrieval、Graph、Citation 都会用到相同规则。如果规则散落在各个 Service，后续接 PGVector、Elasticsearch、多模态时会产生重复和遗漏。

### 后果

- 业务 Service 调用 AccessPolicyService。
- PolicyService 本身保持纯规则，不访问 Prisma / Redis / Neo4j。

## ADR-002：权限过滤在 Reranker 前执行

### 决策

Retrieval raw results 在进入 RRF / Reranker 前先做 policy filter。

### 原因

Reranker 是模型 Provider，无权限内容不应被发送到外部模型服务。

### 后果

- RetrievalService 需要在 raw result 阶段加载 document metadata。
- RRF 只融合已授权结果。

## ADR-003：CONFIDENTIAL 默认只给 OWNER / admin / explicit permission

### 决策

Space EDITOR / VIEWER 默认不能读取 CONFIDENTIAL 文档，除非具备 `knowledge.confidential.read`。

### 原因

企业知识密级应采用保守默认值。EDITOR 代表可编辑知识空间，不代表可读取密级内容。

### 后果

- seed 中新增 `knowledge.confidential.read` permission 并授予 admin role。
- 后续 TASK 可以通过 RBAC 或策略 UI 授权更多角色。

## ADR-004：department 作为 metadata 预留规则，不新增数据库列

### 决策

TASK-042 不新增 schema。Policy 从 DocumentContent / Chunk metadata 中识别：

```text
departmentId
allowedDepartmentIds
```

### 原因

当前 Document Metadata 已是 JSON，可承载策略 metadata。过早新增列和索引会增加迁移成本。

### 后果

- 当前默认生成 metadata 不带 department 限制。
- 后续 metadata 增强或管理 UI 可以直接写入这些字段。

## ADR-005：Graph Retrieval 增加安全入口

### 决策

`GraphRetrievalService` 新增 `retrieveForContext()`，由该方法统一做 tenant scope 和 policy filter。

### 原因

Agent GraphTool 当前直接用 ContextBuilder，绕过了 TASK-041 中 RetrievalService 的 tenant scope。Graph 作为独立 Tool 必须也有安全入口。

### 后果

- GraphTool 调用 `retrieveForContext()`。
- 原有 `retrieve(accessContext)` 保留给内部低层调用。
