# TASK-041：架构决策记录

## ADR-001：tenant filter 放在 Space 聚合根入口

### 决策

Knowledge Space 是 RAG 系统根聚合。Document、Chunk、Embedding、Graph、Pipeline 都挂在 Space 之下，所以 tenant 过滤优先在 Space 访问入口执行。

### 原因

- 避免每个下游模块重复写 tenant 判断。
- 保持 DocumentRepository、ChunkRepository、VectorClient 的职责稳定。
- 对 Controller 保持透明，仍由 Service 接收 ExecutionContext。

### 后果

- 所有需要判断 Space 权限的 Service 必须传入 `context.tenantId`。
- Repository 方法签名会从 `(spaceId, userId)` 升级为 `(spaceId, userId, tenantId)`。

## ADR-002：Retrieval 不信任 context.spaceIds

### 决策

RetrievalService 在每次检索前重新计算当前用户在当前 tenant 下可访问的 Space，并与调用方给出的 `context.spaceIds` 求交集。

### 原因

JWT 可能过期、历史 token 可能带旧 spaceIds，Evaluation 或内部脚本也可能构造错误 context。检索链路必须在服务端重新校验。

### 后果

- RetrievalService 需要依赖 KnowledgeSpaceService。
- 当没有 allowedSpaceIds 时返回空结果。

## ADR-003：legacy tenantId=null 默认不向 tenant 用户开放

### 决策

有 tenant 的用户只访问同 tenant 数据；无 tenant 的 legacy 用户只访问 tenantless 数据。

### 原因

把 tenantId=null 当作“全租户共享”会形成隐性越权。TASK-041 选择安全默认值。

### 后果

- 需要在 seed 中回填 admin 演示数据。
- 未回填的历史数据会对已绑定 tenant 用户不可见，需要后续通过迁移或管理脚本处理。

## ADR-004：不在 TASK-041 实现 securityLevel / department policy

### 决策

TASK-041 只做 tenant-aware RBAC。securityLevel、department 与 Space role 的组合策略留到 TASK-042。

### 原因

多租户边界是横切基础，数据权限策略是下一层规则。分开落地可以降低回归风险。

### 后果

- `DocumentContent.metadata.securityLevel` 仍只传播，不参与过滤。
- Retrieval 只保证 tenant 与 Space membership 隔离。
