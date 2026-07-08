# TASK-019 Sequence Diagram

# 1. Agent Chat Flow

User

|

ChatController

|

AgentService

|

LangGraph Runtime

|

Memory Node

|

MemoryService

|

Planner Node

|

LlmProvider

|

Decision

|

+-------------------+

| |

Simple Complex

| |

Retrieval Node Retrieval Node

                     |

                 Graph Node

| |

Context Fusion

|

Answer Node

|

LlmProvider

|

Verification Node

|

Final Answer

---

# 2. Planner Decision Flow

Question

|

|

Planner

|

|

LLM

|

|

Intent Result

Example:

{

complexity:"HIGH",

needGraph:true,

needMemory:true

}

---

# 3. Verification Retry Flow

Answer

|

Verifier

|

|

+---------+

| |

Pass Fail

| |

END Re-run Retrieval

          |

          END
