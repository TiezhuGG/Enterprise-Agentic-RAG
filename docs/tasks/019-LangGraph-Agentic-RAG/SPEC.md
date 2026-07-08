# TASK-019 Agentic RAG + LangGraph Specification

# 1. Overview

当前系统已经具备：

- Hybrid Retrieval
- GraphRAG
- Memory
- Conversation
- LLM

但是当前 Chat Pipeline 是固定流程。

所有问题：

Question

↓

Retrieval

↓

LLM

导致：

简单问题浪费资源。

复杂问题能力不足。

因此引入 Agentic RAG。

目标：

让系统根据问题自动决定：

- 是否需要 Retrieval
- 是否需要 Graph
- 是否需要 Memory
- 是否需要二次检索

---

# 2. Agent Architecture

整体：

User Question

      |

      v

Agent Runtime

      |

LangGraph State Machine

      |

+-------------------------+

| |

Planner Node Tool Nodes

| |

Decision Retrieval

                         |

                  +------+------+

                  |             |

             Vector RAG    Graph RAG



                  |

             Context Fusion



                  |

            Answer Generator



                  |

            Verification Node



                  |

             Final Answer

---

# 3. LangGraph State

新增 AgentState:

interface AgentState {

question:string;

conversationId:string;

userContext:ExecutionContext;

memoryContext?:MemoryContext;

retrievalContext?:ContextChunk[];

graphContext?:GraphContext[];

answer?:string;

needsRetrieval:boolean;

needsGraph:boolean;

verified:boolean;

}

---

# 4. Agent Nodes

## Planner Node

职责：

分析问题。

输入：

Question

输出:

{

needsRetrieval:true,

needsGraph:false

}

---

## Retrieval Node

调用：

RetrievalService

负责：

Vector

-

Keyword

-

Reranker

---

## Graph Node

调用：

GraphRetrievalService

负责：

Neo4j查询

---

## Memory Node

调用：

MemoryService

负责：

用户历史信息

---

## Answer Node

调用：

LlmProvider

生成最终答案。

---

## Verification Node

检查：

1. 是否有Context

2. 是否存在幻觉风险

如果失败：

触发重新检索。

---

# 5. LangGraph Workflow

Graph:

START

|

Memory Node

|

Planner Node

|

Decision

|

+----------------+

| |

Simple Complex

| |

Retrieval Retrieval

                 +

                Graph

| |

Answer Generator

|

Verifier

|

END

---

# 6. Agent Tools

Agent可调用：

RetrievalTool

GraphTool

MemoryTool

但是：

Tool只是Agent调用入口。

实际业务仍由：

Service负责。

禁止：

Agent直接访问数据库。

---

# 7. Integration

Chat升级：

ChatController

        |

AgentService

        |

LangGraph Runtime

        |

Final Answer

ChatService不再直接编排：

Retrieval

Memory

LLM

改为：

Agent负责流程。

---

# 8. Configuration

新增：

AGENT_MAX_ITERATIONS

AGENT_ENABLE_GRAPH

AGENT_ENABLE_MEMORY

---

# 9. Non Goal

本任务不实现：

- Autonomous Agent

- Multi Agent

- Function Calling

- External Tools

---

# 10. Future Extension

TASK-020:

Voice Streaming

TASK-021:

Production Optimization
