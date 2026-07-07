- [ ] - [ ] # TASK-013 Review Checklist

  ## Retrieval Architecture
  - [ ] RetrievalService存在

  - [ ] VectorRetriever存在

  - [ ] KeywordRetriever存在

  - [ ] RRF存在

  ***

  ## Vector
  - [ ] 使用EmbeddingProvider

  - [ ] 不重复实现Embedding

  ***

  ## Keyword
  - [ ] PostgreSQL FTS

  - [ ] 可未来替换ElasticSearch

  ***

  ## Security
  - [ ] Retrieval前过滤权限

    - [ ] 使用ExecutionContext

    - [ ] 无越权Chunk

    ***

    ## RRF
    - [ ] rank融合

    - [ ] 不直接比较score

    ***

    ## Forbidden
    - [ ] 不生成答案

    - [ ] 不调用LLM

    - [ ] 不实现Agent
