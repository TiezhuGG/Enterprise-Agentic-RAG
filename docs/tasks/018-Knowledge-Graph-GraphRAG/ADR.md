# ADR-022 Knowledge Graph Architecture

## Context

Vector Retrieval擅长语义匹配。

但是无法表达：

部门

制度

岗位

流程

之间关系。

## Decision

引入Neo4j作为关系知识存储。

Architecture:

Document

↓

Chunk

↓

Entity

↓

Relation

↓

Neo4j

## Storage Decision

文本:

PostgreSQL

向量:

Vector Store

关系:

Neo4j

三者职责分离。

## Retrieval Decision

采用Graph + Vector Hybrid:

Vector:

找到相关文本。

Graph:

找到关系路径。

LLM:

综合推理。

## Security

Graph Node必须绑定:

spaceId

避免企业数据泄露。

## Consequence

优势:

支持复杂业务推理。

代价:

增加Graph维护成本。
