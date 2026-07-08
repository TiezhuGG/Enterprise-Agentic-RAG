# TASK-023 RAG Evaluation SPEC

## 目标

建立企业级 RAG 质量评估框架，用于持续验证检索质量、引用质量和回答可信度。

第一版以离线评估为主，不引入复杂实验平台。

---

## 范围

新增：

```text
apps/backend/src/modules/evaluation/
docs/evaluation/
```

后端模块：

```text
evaluation.module.ts
evaluation.service.ts
evaluation.types.ts
run-evaluation.ts
index.ts
```

评估资料：

```text
docs/evaluation/dataset.example.json
docs/evaluation/README.md
docs/evaluation/reports/.gitkeep
```

---

## 能力

必须支持：

- 本地 JSON evaluation dataset
- query
- expected answer
- expected citation chunk ids
- expected citation document ids
- retrieval recall
- citation coverage
- answer expected-term coverage
- answer groundedness
- JSON report
- Markdown report

---

## 数据流

```text
Evaluation Runner
↓
EvaluationService
↓
RetrievalService
↓
ContextChunk[]
```

如果 case 提供 `conversationId`：

```text
EvaluationService
↓
AgentService.execute()
↓
Answer + Citations
```

---

## 禁止

不要：

- 直接访问 Prisma
- 直接访问 VectorClient
- 直接访问 Neo4j / GraphService
- 直接访问 Repository
- 引入外部评测平台
- 引入 LLM-as-judge
- 在报告中输出完整文档内容

---

## Dataset 格式

```ts
interface EvaluationDataset {
  name: string;
  description?: string;
  defaultContext: EvaluationContextInput;
  cases: EvaluationCase[];
}
```

`EvaluationCase` 支持：

```ts
{
  id: string;
  query: string;
  expectedAnswer?: string;
  expectedCitationChunkIds?: string[];
  expectedCitationDocumentIds?: string[];
  conversationId?: string;
  context?: Partial<EvaluationContextInput>;
}
```

---

## 验收

必须通过：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Smoke：

- 可以读取 dataset
- 可以生成 JSON report
- 可以生成 Markdown report
- report 包含 retrieval recall
- report 包含 citation coverage
- report 包含 groundedness
