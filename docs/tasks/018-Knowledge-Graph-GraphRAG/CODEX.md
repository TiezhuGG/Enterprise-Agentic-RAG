TASK-018任务内容：# TASK-018 Knowledge Graph + GraphRAG

你现在负责实现 Enterprise Agentic RAG 项目的 Knowledge Graph + GraphRAG 模块。

必须遵守DDD边界。

目标：

实现：

Document Chunk

↓

Entity Extraction

↓

Relation Extraction

↓

Neo4j Graph Storage

↓

Graph Retrieval

======================

禁止

======================

不要实现：

❌ LangGraph

❌ Agent

❌ Tool Calling

❌ Graph Visualization

======================

Architecture

======================

新增：

apps/backend/src/infrastructure/graph/

graph.client.ts

graph.module.ts

graph.service.ts

graph.types.ts

index.ts

apps/backend/src/modules/knowledge-graph/

knowledge-graph.module.ts

knowledge-graph.service.ts

knowledge-graph.repository.ts

knowledge-graph.types.ts

index.ts

extractors/

entity.extractor.ts

relation.extractor.ts

providers/

llm-graph.provider.ts

======================

Neo4j Infrastructure

======================

Docker增加Neo4j:

neo4j:

ports:

7474

7687

新增配置:

NEO4J_URI

NEO4J_USERNAME

NEO4J_PASSWORD

Neo4j SDK只能存在:

graph.client.ts

业务禁止直接调用Neo4j SDK。

======================

Graph Model

======================

Node:

Entity

字段:

id

name

type

spaceId

documentId

Relationship:

Relation

字段:

type

source

target

documentId

======================

Extraction Pipeline

======================

新增方法:

extractDocumentGraph(documentId)

流程:

DocumentContent

↓

Chunks

↓

EntityExtractor

↓

RelationExtractor

↓

GraphRepository

↓

Neo4j

======================

Entity Extractor

======================

输入:

Chunk.content

输出:

Entity[]

Example:

{

name:"财务部",

type:"DEPARTMENT"

}

======================

Relation Extractor

======================

输入:

Entity + Chunk

输出:

Triple:

{

subject:"财务部",

predicate:"负责",

object:"报销制度"

}

======================

LLM Provider

======================

复用已有 LlmProvider。

禁止新增HTTP调用。

======================

Graph Retrieval

======================

新增:

GraphRetrievalService

流程:

Question

↓

Entity Extraction

↓

Neo4j Query

↓

GraphContext[]

======================

Hybrid RAG Integration

======================

升级 Retrieval Pipeline:

Vector Context

-

Keyword Context

-

Graph Context

↓

ContextBuilder

↓

LLM

======================

Security

======================

所有Graph Query必须带:

spaceId过滤。

禁止跨Space查询。

======================

Testing

======================

必须验证:

1.

Document生成Chunk

2.

Graph Extraction成功

3.

Neo4j存在Node

4.

Neo4j存在Relation

5.

Graph Retrieval返回结果

6.

Space隔离有效

输出:

目录结构

Graph设计

Neo4j实现

Extraction流程

Retrieval集成

测试结果
