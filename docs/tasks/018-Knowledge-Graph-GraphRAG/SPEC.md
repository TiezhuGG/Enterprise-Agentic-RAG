# TASK-018 Knowledge Graph + GraphRAG Specification

## 1. Overview

当前系统已经具备：

Document

↓

Parser

↓

Chunk

↓

Embedding

↓

Hybrid Retrieval

↓

Reranker

↓

Chat

↓

Memory

但是当前RAG主要依赖文本相似度。

存在问题：

1. 无法理解实体之间关系

2. 无法解决跨文档关联问题

3. 无法回答复杂业务推理问题

例如：

问题：

"哪个部门负责员工报销制度？"

Vector只能找到：

"员工报销制度"

但是不知道：

财务部

↓

负责

↓

报销制度

因此引入Knowledge Graph。

---

# 2. Goal

实现企业级GraphRAG能力：

Document

↓

Chunk

↓

Entity Extraction

↓

Relation Extraction

↓

Neo4j Graph

↓

Graph Retrieval

↓

Graph Context

↓

LLM Answer

---

# 3. Architecture

整体架构：

                 Document


                    |


                Chunk


                    |


          +---------+---------+


          |                   |


      Embedding          Graph Extraction


          |                   |


     Vector Store          Neo4j


          |                   |


          +---------+---------+


                    |


              Retrieval Layer


                    |


              Context Builder


                    |


                   LLM

---

# 4. Domain Design

## Entity

表示业务实体。

例如：

Department

Policy

Product

Employee

System

Entity:

id

name

type

spaceId

documentId

---

## Relation

表示实体关系。

例如:

财务部

↓

负责

↓

报销制度

Relation:

id

sourceEntityId

targetEntityId

type

documentId

spaceId

---

# 5. Graph Storage

采用Neo4j。

原因：

- 原生图查询

- 多跳关系

- 节点关系表达能力强

PostgreSQL:

保存业务数据。

Vector:

保存语义关系。

Neo4j:

保存实体关系。

三者职责分离。

---

# 6. Extraction Pipeline

## Input

DocumentContent

↓

Chunk

---

## Entity Extraction

调用LLM。

Prompt要求：

从文本中抽取：

实体名称

实体类型

输出:

[
{
name:"财务部",
type:"DEPARTMENT"
}
]

---

## Relation Extraction

输入:

Chunk

-

Entity

输出:

[
{
subject:"财务部",
predicate:"负责",
object:"报销制度"
}
]

---

# 7. Graph Retrieval

用户问题:

"谁负责采购审批？"

流程:

Question

↓

Entity Extraction

↓

Entity Search

↓

Neo4j Query

↓

Graph Path

↓

Graph Context

---

# 8. Hybrid GraphRAG

最终Context:

Vector Context

-

Keyword Context

-

Graph Context

统一进入:

ContextBuilder

然后:

PromptBuilder

↓

LLM

---

# 9. Security

Graph必须继承KnowledgeSpace权限。

所有Node:

必须包含:

spaceId

所有Query:

必须:

WHERE spaceId IN allowedSpaces

禁止:

跨Space Graph Query。

---

# 10. Non Goal

本任务不实现:

- LangGraph

- Agent

- Tool Calling

- Graph UI

- 自动知识发现Agent

---

# 11. Future Extension

TASK-019:

Agentic RAG

将负责:

自动判断：

Vector Query

还是

Graph Query
