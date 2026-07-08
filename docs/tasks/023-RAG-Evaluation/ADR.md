# ADR-023 RAG Evaluation

## 状态

Accepted

## 背景

项目已经具备 Knowledge Space、Document Pipeline、Chunk、Embedding、Hybrid Retrieval、Reranker、GraphRAG、Agent 和 Streaming UI。

下一步需要一个可重复运行的评估框架，用于发现检索质量和引用质量退化。

## 决策

第一版采用离线 JSON dataset + 本地 report 的方式。

Evaluation 模块只调用：

```text
RetrievalService
AgentService
```

不直接访问数据库、向量库、Neo4j 或 Repository。

## 取舍

本任务不引入 LLM-as-judge。

原因：

- 评估结果更可重复
- 不增加模型依赖
- 不引入额外成本
- 便于 CI 后续接入

第一版 groundedness 使用词项覆盖率近似计算。

## 后果

优点：

- 架构边界清晰
- 可以离线运行
- 易于后续接 CI
- 能快速发现 retrieval/citation 回归

限制：

- 语义评估能力有限
- 中文复杂语义相似度只做近似
- 后续可单独引入 LLM Judge 或人工标注集
