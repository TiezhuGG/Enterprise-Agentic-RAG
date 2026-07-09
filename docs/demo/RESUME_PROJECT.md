# Resume Project Description

## 中文简历版

Enterprise Agentic RAG：面向企业知识库的 Agentic RAG MVP。

基于 NestJS、Next.js、Prisma、PostgreSQL/pgvector、Elasticsearch、Redis、MinIO、Neo4j 和 LangGraph 构建，支持 Knowledge Space、文档上传入库、Markdown 清洗、语义分块、Embedding、Hybrid Retrieval、RRF、Reranker、GraphRAG、Conversation Memory、JWT/RBAC、多租户隔离、Execution Trace、Metrics、Agent Streaming API 与前端 Demo Workbench。项目按 DDD 分层约束实现，业务层通过 Repository / Provider / Infrastructure Service 访问数据库、对象存储、向量检索、搜索引擎和模型服务。

## English Resume Version

Enterprise Agentic RAG: an MVP for enterprise knowledge-base question answering.

Built with NestJS, Next.js, Prisma, PostgreSQL/pgvector, Elasticsearch, Redis, MinIO, Neo4j, and LangGraph. The system supports knowledge spaces, document ingestion, markdown normalization, semantic chunking, embeddings, hybrid retrieval, RRF fusion, reranking, GraphRAG, conversation memory, JWT/RBAC, tenant-aware access control, execution tracing, metrics, streaming Agent APIs, and a demo frontend workbench. The backend follows DDD boundaries where business modules depend on repositories, providers, and infrastructure services instead of directly accessing databases or external SDKs.

## 技术亮点

- 端到端 RAG 闭环：Upload -> Processing -> Chunk -> Embedding -> Retrieval -> Rerank -> Agent Answer。
- LangGraph Agent Runtime：Memory、Planner、Retrieval、Graph、Answer、Verification 节点编排。
- 企业权限边界：Tenant、Organization、Department、Space Role、SecurityLevel 组合过滤。
- 可观测性：Health、Readiness、Prometheus-style Metrics、Execution Timeline、Pipeline Events。
- 可部署演示：Docker Compose、demo seed、provider smoke、前端 Workbench。

## 准确边界

已实现：

- 单 Agent RAG workflow。
- Tool Registry。
- PGVector + Elasticsearch + Graph hybrid retrieval。
- OCR / ASR / Video provider 边界和 metadata fallback。
- 多租户与访问策略。
- Demo Workbench 和 Observability Workbench。

未实现或未作为 MVP 目标：

- Multi-Agent 协作。
- Autonomous Agent。
- 外部工具 Function Calling。
- 图谱可视化编辑器。
- 商业级权限后台。
- 大规模异步队列和分布式调度。

## 面试讲解顺序

1. 为什么先做 DDD 边界和配置校验。
2. 文档从上传到可检索的完整链路。
3. Hybrid Retrieval 如何融合 PGVector、Elasticsearch、Graph 和 Reranker。
4. Agent 如何用 LangGraph 编排 memory/retrieval/answer/verification。
5. 多租户和 access policy 如何阻止越权检索。
6. Observability 如何支撑调试和线上排错。
