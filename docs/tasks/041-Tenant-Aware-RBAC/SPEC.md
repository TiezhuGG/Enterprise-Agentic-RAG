# TASK-041：Tenant-Aware RBAC

## 目标

在 TASK-040 的 Tenant / Organization / Department 模型基础上，将现有 Space、Document、Pipeline、Retrieval 与 Agent 链路升级为 tenant-aware。

本任务只做租户边界过滤，不实现复杂数据权限策略。目标是确保：

- 用户只能看到当前 tenant 下自己作为成员加入的 Knowledge Space。
- Document、Upload、Pipeline 访问必须通过 tenant-aware Space 校验。
- Retrieval 不能返回跨 tenant 的 Chunk / Graph Context。
- Agent / Chat 继续通过 ExecutionContext 传递 tenantId，不让业务模块自行解析 JWT。
- Demo seed 能回填历史 tenantId 为空的演示数据，避免工作台数据丢失。

## 禁止项

- 不新增后台管理 UI。
- 不实现 Tenant / Organization / Department CRUD 页面。
- 不实现 department/securityLevel 组合权限策略。
- 不实现 PGVector / Elasticsearch。
- 不改 Agent 编排和 LangGraph 节点语义。
- 不让 Controller 访问 Repository、Prisma、Redis、Neo4j 或 Provider。
- 不放宽为“有 tenant 用户也能读 tenantId=null 数据”。

## 范围

### Backend

更新：

```text
apps/backend/src/modules/knowledge-space/
apps/backend/src/modules/document/
apps/backend/src/modules/upload/
apps/backend/src/modules/pipeline/
apps/backend/src/modules/ingestion/
apps/backend/src/modules/retrieval/
apps/backend/src/modules/enterprise/
apps/backend/src/infrastructure/prisma/seed.ts
```

### 核心策略

```text
if context.tenantId exists:
  query tenantId = context.tenantId
else:
  query tenantId = null
```

即：

- 已绑定 tenant 的用户只能访问同 tenant 数据。
- 未绑定 tenant 的 legacy 用户只能访问 legacy tenantless 数据。
- 迁移期通过 seed 回填 demo/admin 相关 Space 的 tenantId。

## API 行为

不新增公开 API。

现有 API 的访问结果变为 tenant-aware：

```text
GET /spaces
GET /spaces/:id
POST /spaces/:spaceId/documents/upload
GET /spaces/:spaceId/documents
GET /documents/:id
GET /documents/:id/metadata
POST /documents/:id/ingest
GET /documents/:id/pipeline/jobs
GET /pipeline/jobs/:jobId/events
POST /agent/chat
POST /agent/chat/stream
POST /chat/:conversationId
```

## Retrieval 要求

RetrievalService 不能只信任 `context.spaceIds`。必须在执行 retriever 前重新计算：

```text
当前用户 + 当前 tenant + Space membership
```

得到 tenant-scoped allowedSpaceIds，再传给：

- VectorRetriever
- KeywordRetriever
- GraphRetriever

当没有可访问 Space 时返回空结果，不抛跨租户相关细节。

## Seed / 历史数据

`pnpm db:seed` 必须：

- 创建默认 Tenant / Organization / Department。
- 将 admin 用户绑定到默认 tenant。
- 将 admin 作为 owner/member 的 legacy `tenantId = null` Space 回填为默认 tenant。

## 验收标准

- tenant A 用户看不到 tenant B 的 Space。
- tenant A 用户无法读取 tenant B Space 下 Document。
- Upload / Pipeline 对跨 tenant Space 返回 NotFound 或 Forbidden。
- Retrieval 不返回跨 tenant Chunk。
- Graph Retrieval 不返回跨 tenant Graph Context。
- Agent / Chat / Demo Workbench 仍可正常运行。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
- `pnpm db:validate` 通过。
- `pnpm db:migrate` 通过。
- `pnpm db:seed` 通过。
