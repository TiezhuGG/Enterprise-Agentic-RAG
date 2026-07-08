# TASK-042：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的后端架构工程师。

请严格遵守 DDD 分层和现有架构，实现 Data Permission Policy。

## 必须先阅读

```text
docs/tasks/042-Data-Permission-Policy/SPEC.md
docs/tasks/042-Data-Permission-Policy/SEQUENCE.md
docs/tasks/042-Data-Permission-Policy/ADR.md
docs/tasks/042-Data-Permission-Policy/REVIEW.md
docs/tasks/042-Data-Permission-Policy/CODEX.md
```

## 目标

在 tenant-aware RBAC 基础上，统一处理企业知识数据权限：

- tenantId
- departmentId
- space role
- document securityLevel

## 必须实现

- 新增 `apps/backend/src/modules/access-policy/`
- `AccessPolicyService` 支持：
  - canReadKnowledgeResource()
  - assertCanReadKnowledgeResource()
  - filterRetrievalResults()
  - filterGraphContexts()
- DocumentService 读路径接入 policy。
- RetrievalService 在 RRF / Reranker 前接入 policy。
- GraphRetrievalService 新增面向 ExecutionContext 的安全入口。
- GraphTool 调用安全入口。
- Chunk metadata 支持 department policy 字段。
- seed 增加 `knowledge.confidential.read`，默认授予 admin。

## 禁止

- 不新增数据库表。
- 不新增后台 UI。
- 不实现 Role CRUD / Department CRUD。
- 不把权限判断写进 Controller。
- 不让 AccessPolicyService 访问 Prisma / Redis / Neo4j。
- 不把无权限内容发送给 Reranker / LLM。
- 不泄露无权限 citation。

## 验证

完成后执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:seed
```

输出：

- 修改文件列表
- Access Policy 设计说明
- Document / Retrieval / Graph 接入说明
- 权限策略说明
- 测试结果
