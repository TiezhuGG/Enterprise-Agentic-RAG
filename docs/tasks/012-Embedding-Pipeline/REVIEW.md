- [ ] - [ ] # TASK-012 Review Checklist

  ## Architecture
  - [ ] EmbeddingService存在

  - [ ] Provider抽象存在

  - [ ] Vector Infrastructure存在

  ***

  ## Database
  - [ ] ChunkEmbedding存在

  - [ ] Chunk一对一关系

  - [ ] vector字段支持PGVector

  ***

  ## Boundary
  - [ ] EmbeddingService不访问Prisma

    - [ ] Provider不负责存储

    - [ ] Vector Client不进入业务模块

    ***

    ## Processing

  - [ ] Chunk作为唯一输入

    - [ ] 支持重复生成

    - [ ] 保留chunkId关联

    ***

    ## Forbidden
    - [ ] 没有Retrieval

    - [ ] 没有Search API

    - [ ] 没有Reranker

    ***

    ## Future
    - [ ] 支持Hybrid Search

    - [ ] 支持Query Embedding

    - [ ] 支持Agent调用
