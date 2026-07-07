# TASK-014 Reranker Context Optimization Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格遵守DDD和Infrastructure隔离原则。

=========================

目标

=========================

在Hybrid Retrieval之后增加Reranker层。

最终流程：

Retrieval

↓

RRF

↓

Reranker

↓

Context Builder

=========================

禁止实现

=========================

不要实现：

❌ LLM Answer

❌ Chat API

❌ Agent

❌ LangGraph

❌ Memory

=========================

新增模块

=========================

创建：

apps/backend/src/modules/reranker/

结构：

reranker.module.ts

reranker.service.ts

reranker.types.ts

providers/

reranker.provider.ts

bge-reranker.provider.ts

=========================

Provider设计

=========================

实现接口：

interface RerankerProvider {

rerank(

query:string,

documents:RerankDocument[]

):Promise<RerankScore[]>

}

=========================

BGE Provider

=========================

实现OpenAI-compatible风格HTTP调用。

要求：

使用ConfigService

禁止process.env

禁止写死API Key

新增配置：

RERANKER_API_URL

RERANKER_API_KEY

RERANKER_MODEL

=========================

Reranker流程

=========================

输入：

query

-

RRF RetrievalResult[]

处理：

调用RerankerProvider

返回score排序结果

=========================

Pipeline改造

=========================

修改：

RetrievalService

原流程：

Vector

-

Keyword

↓

RRF

↓

Context

改为：

Vector

-

Keyword

↓

RRF

↓

Reranker

↓

Context

=========================

Context优化

=========================

ContextBuilder增加：

MAX_CONTEXT_TOKENS

默认：

3000

规则：

按score降序

依次加入chunk

超过token预算停止

=========================

类型设计

=========================

RerankResult:

chunkId

score

ContextChunk:

chunkId

documentId

content

score

metadata

=========================

架构要求

=========================

必须：

RerankerService

↓

RerankerProvider

禁止：

Service直接调用HTTP

=========================

测试要求

=========================

完成后验证：

1.

创建Space

2.

上传Document

3.

生成Chunk

4.

生成Embedding

5.

执行Retrieval

验证：

RRF结果存在

Reranker结果存在

排序变化正确

Context token限制生效

输出：

1.

新增目录结构

2.

Reranker设计

3.

Pipeline变化

4.

Context优化策略

5.

测试结果

6.

未来LLM接入方式
