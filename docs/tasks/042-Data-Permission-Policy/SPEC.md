# TASK-042：Data Permission Policy

## 目标

在 TASK-041 tenant-aware RBAC 基础上，新增统一企业知识数据权限策略。

本任务解决：

- Document read 不能绕过 `securityLevel`。
- Retrieval 不能把无权限 Chunk 送入 RRF / Reranker / LLM。
- Citation 不能泄露无权限文档内容或元数据。
- Graph Retrieval 不能绕过 tenant / policy 过滤。
- 未来 department / securityLevel / space role 的组合策略有统一入口。

## 非目标

- 不实现 Role CRUD。
- 不实现 Department CRUD。
- 不实现权限后台页面。
- 不新增复杂策略 DSL。
- 不新增数据库表。
- 不改 PGVector / Elasticsearch。
- 不实现真实文档密级编辑 UI。
- 不让 Agent 直接处理权限判断。

## 新增目录

```text
apps/backend/src/modules/access-policy/
├── access-policy.module.ts
├── access-policy.service.ts
├── access-policy.types.ts
└── index.ts
```

## Policy 输入

### Subject

```ts
interface AccessPolicySubject {
  userId: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  departmentId?: string;
}
```

### Resource

```ts
interface KnowledgeResourceAccess {
  tenantId?: string | null;
  spaceId: string;
  spaceRole?: 'OWNER' | 'EDITOR' | 'VIEWER' | null;
  securityLevel?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  departmentId?: string | null;
  allowedDepartmentIds?: string[];
}
```

## 规则

### Tenant

- subject 有 `tenantId`：resource 有 tenant 时必须相等。
- subject 没有 `tenantId`：resource tenant 必须为空。
- TASK-041 已在 Space 层做第一道过滤，policy 仍保留 tenant 判断作为第二道保护。

### Space Role

读知识必须至少是：

```text
OWNER / EDITOR / VIEWER
```

### Security Level

```text
PUBLIC:
  允许当前 Space 成员读取。

INTERNAL:
  允许当前 Space 成员读取。

CONFIDENTIAL:
  只允许：
  - Space OWNER
  - admin role
  - 拥有 knowledge.confidential.read permission
```

### Department

metadata 可选字段：

```text
departmentId
allowedDepartmentIds
```

当资源带 department 限制且不是 PUBLIC 时：

- admin / Space OWNER 可读。
- 其他用户必须 `context.departmentId` 命中资源 department。

当前 Document Metadata 默认不生成 department 字段，本任务只实现识别和传播。

## 接入点

### Document

`DocumentService`：

- `listBySpace()`
- `getById()`
- `getMetadata()`

必须调用 `AccessPolicyService`。

### Retrieval

`RetrievalService`：

```text
Vector + Keyword + Graph raw results
-> AccessPolicyService filter
-> RRF
-> Reranker
-> ContextBuilder
```

权限过滤必须发生在 Reranker 之前，避免无权限正文进入模型服务。

### Graph

`GraphTool` 不再自己构造 raw access context。

新增安全入口：

```text
GraphRetrievalService.retrieveForContext(context, query, limit)
```

该方法负责：

- tenant-scoped spaceIds
- space role map
- document metadata policy filter

## Seed

新增 permission：

```text
knowledge.confidential.read
```

默认只授予 `admin` role。

## Evaluation

补充示例 dataset 中的权限隔离 case 说明，覆盖：

- CONFIDENTIAL 文档普通用户不可召回。
- department 不匹配时不可召回受限知识。

## 验收标准

- CONFIDENTIAL Chunk 不进入普通用户 Retrieval 结果。
- CONFIDENTIAL Chunk 可被 admin / OWNER / confidential permission 用户读取。
- department 不匹配时受限知识不可读。
- Document metadata API 不泄露无权限 metadata。
- Citation 不包含被过滤文档内容。
- GraphTool 走安全入口，不直接使用未经 tenant scope 的 `context.spaceIds`。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
- `pnpm db:validate` 通过。
