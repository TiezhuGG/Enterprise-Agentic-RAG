# TASK-020 SPEC

## Goal

Expose Agent workflow as production API.

---

## Requirements

Implement:

1. AgentController

Location:

apps/backend/src/modules/agent/

Create:

agent.controller.ts

---

## API

### POST /agent/chat

Request:

{
conversationId:string,
question:string
}

Response:

{
answer:string,
citations:[],
metadata:{
verified:boolean,
usedGraph:boolean,
usedMemory:boolean
}
}

---

### POST /agent/chat/stream

Response:

Server Sent Events

Event:

data:{
type:string,
data:any
}

Events:

thought

planner node output

retrieval

retrieval completed

graph

graph retrieval completed

token

LLM token

citation

source citation

done

workflow completed

---

## Agent Execution Result

Extend AgentState:

Add:

executionId:string

trace:

[
{
node:string,
startTime,
endTime,
status
}
]

citations:

[
{
documentId,
chunkId,
content
}
]

---

## Service

AgentService:

add:

execute()

executeStream()

executeStream returns:

AsyncIterable<AgentEvent>

---

## Rules

Controller:

- no business logic
- no repository access
- no provider access

AgentService:

- orchestrates AgentGraph

Nodes:

remain unchanged.

---

## Validation

Need pass:

pnpm format:check

pnpm lint

pnpm typecheck

pnpm build

Smoke:

POST /agent/chat

returns answer

POST /agent/chat/stream

receives:

thought

token

done
