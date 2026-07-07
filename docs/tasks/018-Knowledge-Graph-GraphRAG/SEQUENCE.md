# TASK-018 Knowledge Graph Sequence Diagram

# 1. Document Graph Construction Flow

管理员上传文档:

User

|

|

Upload Document

|

DocumentService

|

DocumentProcessingService

|

DocumentContent

|

ChunkService

|

Chunk[]

|

KnowledgeGraphService

|

EntityExtractor

|

LLM

|

Entities

|

RelationExtractor

|

LLM

|

Triples

|

GraphRepository

|

Neo4j

|

Graph Stored

---

# 2. Entity Extraction Flow

Chunk

|

|

KnowledgeGraphService

|

|

EntityExtractor

|

|

LlmProvider

|

|

Entity JSON

|

|

GraphRepository

|

|

Neo4j Node

---

# 3. Relation Extraction Flow

Chunk

|

|

Existing Entities

|

|

RelationExtractor

|

|

LlmProvider

|

|

Triple

|

|

Neo4j Edge

---

# 4. Graph Retrieval Flow

User Question

|

|

ChatController

|

|

ChatService

|

|

GraphRetrievalService

|

|

Question Entity Extraction

|

|

Neo4j Query

|

|

Graph Context

|

|

ContextBuilder

|

|

PromptBuilder

|

|

LLM

|

|

Answer

---

# 5. Hybrid GraphRAG Flow

Question

      |

      |

      +----------------+

      |                |

Vector Retrieval Graph Retrieval

      |                |

Chunks Graph Paths

      |                |


      +-------+--------+


              |


       ContextBuilder


              |


          Prompt


              |


             LLM

---

# 6. Permission Filtering Flow

User

|

|

JWT

|

|

ExecutionContext

|

|

Allowed Space IDs

|

|

Graph Query

|

|

Neo4j:

MATCH

(node)

WHERE node.spaceId IN allowedSpaces

返回结果
