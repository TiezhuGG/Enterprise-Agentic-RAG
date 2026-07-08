# TASK-020 Sequence

## Normal Chat

User

↓

AgentController

↓

AgentService.execute()

↓

AgentGraph

↓

Memory Node

↓

Planner Node

↓

Retrieval Node

↓

Graph Node(optional)

↓

Answer Node

↓

Verification Node

↓

Return AgentResponse

---

# Streaming

User

↓

POST /agent/chat/stream

↓

AgentController

↓

AgentService.executeStream()

↓

AgentGraph

Node Event

↓

SSE Encoder

↓

Frontend

Events:

thought

↓

retrieval

↓

graph

↓

token

↓

citation

↓

done

---

# Error Flow

Node Failure

↓

AgentGraph catch

↓

AgentService converts AgentError

↓

SSE:

{
type:"error"
}
