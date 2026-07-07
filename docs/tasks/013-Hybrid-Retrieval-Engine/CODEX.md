# TASK-013 Hybrid Retrieval Engine Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格遵守DDD架构。

=========================

目标

=========================

实现知识检索引擎。

输入：

用户query

输出：

Relevant Chunks

=========================

禁止实现

=========================

不要实现：

❌ Agent

❌ LangGraph

❌ Answer Generation

❌ Reranker

❌ Elasticsearch

=========================

新增模块：

apps/backend/src/modules/retrieval/

结构：

retrieval.module.ts

retrieval.service.ts

retrieval.types.ts

retrievers/

vector.retriever.ts

keyword.retriever.ts

fusion/

rrf.fusion.ts

context/

context.builder.ts

=========================

实现 Vector Retrieval

流程：

Query

↓

EmbeddingProvider

↓

VectorService

↓

Candidate Chunks

=========================

实现 Keyword Retrieval

使用：

PostgreSQL Full Text Search

不要引入ElasticSearch。

=========================

实现 RRF

算法：

score(d)=Σ1/(60+rank)

输入：

vector results

keyword results

输出：

merged results

=========================

权限过滤

必须使用：

KnowledgeRequestContext

过滤：

spaceIds

permissions

roles

禁止：

无权限Chunk进入结果。

=========================

返回类型

RetrievalResult:

chunkId

documentId

content

score

metadata

=========================

架构规则

必须：

RetrievalService

↓

Retriever

↓

Repository / Infrastructure

禁止：

Service直接访问Prisma

=========================

数据库

如需增加字段：

必须migration。

=========================

测试要求

完成后验证：

1.

创建Knowledge Space

2.

上传多个Document

3.

生成Chunk

4.

生成Embedding

5.

执行query

验证：

Vector结果存在

Keyword结果存在

RRF融合正确

权限过滤正确

输出：

1.

新增目录结构

2.

Retrieval设计

3.

Vector Retrieval实现

4.

Keyword Retrieval实现

5.

RRF实现

6.

测试结果

7.

未来Reranker接入方式
