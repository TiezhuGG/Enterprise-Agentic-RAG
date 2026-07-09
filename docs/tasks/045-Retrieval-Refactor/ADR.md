# TASK-045：架构决策记录

## 决策 1：保留 RetrievalService 作为唯一编排层

Vector、Keyword、Graph、RRF、Reranker、Context Builder 都已经存在。TASK-045 不新增新的“大模块”，而是在 `RetrievalService` 中显式组织 pipeline。

后果：

- 不破坏现有 DDD 边界。
- 检索编排仍然集中，不散落到 Agent 或 Controller。
- 后续 TASK 可以继续把 pipeline step 抽成独立类，但当前不急着过度抽象。

## 决策 2：新增 retrieveWithBreakdown，保留 retrieve

已有 Agent、Chat、Evaluation 调用依赖 `retrieve(): ContextChunk[]`。

为了避免破坏调用方，新增：

```ts
retrieveWithBreakdown(): Promise<RetrievalPipelineResult>
```

并让旧 `retrieve()` 调用新方法后只返回 `chunks`。

后果：

- 向后兼容。
- Evaluation 和 Agent Trace 可以读取 breakdown。
- 前端 API 不需要新增 endpoint。

## 决策 3：Breakdown 只记录安全 metadata

Retrieval query、chunk content、prompt 和 answer 都可能包含敏感信息。

Breakdown 只记录：

```text
count
duration
status
reason
limit
```

后果：

- 可以持久化到 ExecutionTraceEvent.metadata。
- 可以展示在前端 Observability。
- 不泄露企业知识正文。

## 决策 4：权限过滤仍由 AccessPolicyService 统一执行

PGVector、Elasticsearch、Graph 可以做空间级过滤，但最终权限必须由 `AccessPolicyService` 判断。

后果：

- tenant / department / securityLevel 策略不散落。
- 更换检索底座不会破坏权限语义。
- Retrieval refactor 不会倒退 TASK-041 / TASK-042 的安全边界。

## 决策 5：Evaluation 使用同一 RetrievalService

Evaluation 不直接访问 Repository、Vector、Elasticsearch 或 Neo4j。

后果：

- 评估的是生产路径，不是测试捷径。
- Hybrid regression 能覆盖真实 pipeline。
- 权限过滤也会被评估覆盖。

## 决策 6：前端只展示 breakdown，不解释算法

Observability Workbench 面向演示和排障。

本任务只展示每个阶段的 count / duration / status，不在 UI 里写长篇算法解释。

后果：

- UI 保持紧凑。
- 面试演示时可以口头解释 RRF / Reranker。
