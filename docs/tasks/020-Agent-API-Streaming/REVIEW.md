当前状态：
ChatController
↓
AgentService
↓
LangGraph Workflow
↓
Answer

但是生产级系统还缺少：

Agent 对外 API
Agent Streaming
Agent Trace
Agent Execution Metadata
前端可消费的数据结构

本任务目标：

把 Agent 从内部能力升级成真正的企业 AI Assistant API。

完成后：

Frontend
|
| POST /agent/chat
|
AgentController
|
AgentService
|
AgentGraph
|
-------------------------

| Memory Node |
| Planner Node |
| Retrieval Node |
| Graph Node |
| Answer Node |
| Verification Node |
-------------------------

    |

SSE Stream Response
