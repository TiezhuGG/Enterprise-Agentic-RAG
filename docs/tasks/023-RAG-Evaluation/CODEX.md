# TASK-023 RAG Evaluation Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

必须严格遵守 DDD 边界。

## 目标

实现 RAG Evaluation 框架。

新增：

```text
apps/backend/src/modules/evaluation/
docs/evaluation/
```

## 必须实现

- evaluation dataset 类型
- EvaluationService
- 离线 runner
- retrieval recall
- citation coverage
- answer expected-term coverage
- answer groundedness
- JSON report
- Markdown report
- dataset example

## 架构要求

必须：

```text
EvaluationService
↓
RetrievalService / AgentService
```

禁止：

- EvaluationService 直接访问 Prisma
- EvaluationService 直接访问 Repository
- EvaluationService 直接访问 VectorClient
- EvaluationService 直接访问 Neo4j / GraphService
- 引入外部评测平台
- 引入 LLM-as-judge

## 默认策略

- 没有 `conversationId` 时，只做 retrieval evaluation
- 有 `conversationId` 时，执行 Agent answer evaluation
- case 失败时记录失败并继续
- report 不输出完整 chunk content
- groundedness 用 answer token 与 citation/retrieval context token 覆盖率近似计算

## 验证

执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Smoke：

- 读取 dataset
- 生成 JSON report
- 生成 Markdown report
- report 包含 retrieval recall / citation coverage / groundedness

## 输出

返回：

- 新增文档
- 新增模块
- dataset/report 说明
- 测试结果
