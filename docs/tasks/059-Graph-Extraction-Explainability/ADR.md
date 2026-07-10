# TASK-059：ADR

## 决策

图谱解释性优先复用 PipelineJob / PipelineEvent metadata，不新增数据库表或后端接口。

## 原因

- Pipeline 已经是文档入库阶段记录的事实来源。
- Graph extraction 是 Ingestion 的一个阶段，解释信息放在 stage metadata 最自然。
- 前端当前已经能读取 Pipeline events，无需额外 API。

## 图谱失败策略

图谱抽取属于增强能力，不属于基础 RAG 必需能力。

因此：

- document-processing / chunking / embedding 失败仍会导致入库失败。
- graph-extraction 失败只记录 failed stage。
- 只要基础检索链路成功，Document 仍可进入 READY。

## 取舍

第一版只展示实体类型分布和失败原因，不展示每个 chunk 的抽取明细。

原因：

- chunk 级明细容易引入正文泄露风险。
- 详细抽取审计可以后续独立做 Graph Extraction Audit。

## 后果

- Demo 更稳定，Neo4j 或 Graph LLM 不可用时不影响基础问答演示。
- 用户能够理解图谱为空是因为未启用、未抽到、还是失败。
- 后续 TASK-060 GraphRAG Reasoning Path 可以继续复用这些 metadata。
