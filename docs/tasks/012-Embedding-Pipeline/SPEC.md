- # TASK-012 Embedding Pipeline Technical Specification

  # 1. Overview

  本任务实现知识库向量化能力。

  输入：

  Chunk

  输出：

  Embedding Vector

  ***

  # 2. Architecture

  Chunk

  |

  EmbeddingService

  |

  EmbeddingProvider

  |

  Embedding Model

  |

  VectorRepository

  |

  PGVector

  ***

  # 3. Design Goal

  实现：

  - Chunk内容向量化

  - 向量持久化

  - 支持未来替换Embedding模型

  - 支持PGVector语义检索

  ***

  # 4. New Modules

  新增：

  apps/backend/src/modules/embedding/

  结构：

  embedding.module.ts

  embedding.service.ts

  embedding.types.ts

  providers/

      embedding.provider.ts

      openai-compatible.provider.ts

  ***

  # 5. Infrastructure

  新增：

  apps/backend/src/infrastructure/vector/

  结构：

  vector.module.ts

  vector.service.ts

  vector.client.ts

  vector.types.ts

  职责：

  封装PGVector访问。

  ***

  # 6. Database Design

  新增：

  ChunkEmbedding

  字段：

  id

  chunkId

  model

  dimension

  vector

  createdAt

  updatedAt

  关系：

  Chunk

  1

  :

  1

  ChunkEmbedding

  ***

  # 7. Embedding Flow

  processEmbedding(documentId)

  流程：

  读取Document所有Chunk

  ↓

  循环Chunk

  ↓

  调用EmbeddingProvider

  ↓

  生成vector

  ↓

  保存ChunkEmbedding

  ***

  # 8. Provider Design

  禁止EmbeddingService直接调用模型API。

  必须：

  EmbeddingService

  ↓

  EmbeddingProvider Interface

  ↓

  具体实现

  ***

  # 9. Interface

  EmbeddingProvider:

  embed(text:string)

  返回:

  number[]

  ***

  # 10. Idempotency

  重复执行：

  processEmbedding(documentId)

  必须：

  delete old embeddings

  重新生成

  ***

  # 11. Future Extension

  未来支持：

  - Batch embedding

  - Local model

  - BGE

  - Jina

  - Ollama

  - OpenAI
