# ADR-023 Agentic RAG Architecture

## Context

固定RAG Pipeline无法适应复杂问题。

不同问题需要不同推理路径。

因此引入Agent Orchestration。

---

## Decision

采用LangGraph State Machine。

原因:

- 明确状态流转

- 支持条件分支

- 支持循环

- 易调试

---

## Architecture

Agent负责：

Workflow Decision

Service负责：

业务能力

例如：

Agent

↓

RetrievalTool

↓

RetrievalService

禁止Agent直接操作数据库。

---

## Why LangGraph

相比普通Chain:

Chain:

A -> B -> C

固定流程。

LangGraph:

A

|

Decision

|

B/C/D

支持动态路径。

---

## Consequence

优势:

- 动态RAG

- 可扩展Agent能力

- 支持复杂推理

代价:

增加系统复杂度。
