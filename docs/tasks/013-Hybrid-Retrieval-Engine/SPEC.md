- - # TASK-013 Hybrid Retrieval Engine Technical Specification

  # 1. Overview

  本任务实现RAG检索核心。

  输入：

  User Query

  输出：

  Relevant Chunks

  ***

  # 2. Architecture

  ```
                   User Query


                     |

              Retrieval Engine


                       |

          +------------+------------+

          |                         |

     Vector Search            Keyword Search


        |                         |

          +------------+------------+

                       |

                      RRF


                       |

               Permission Filter


                       |

                   Context Builder


  ```

  ***

  # 3. Retrieval Strategy

  采用Hybrid Retrieval：

  ## Vector Retrieval

  Query

  ↓

  EmbeddingProvider

  ↓

  Query Vector

  ↓

  Vector Search

  ↓

  Candidate Chunks

  ***

  ## Keyword Retrieval

  第一版：

  PostgreSQL Full Text Search

  使用：

  tsvector

  -

  tsquery

  原因：

  MVP阶段避免引入ElasticSearch。

  未来：

  替换为ElasticSearch。

  ***

  # 4. New Modules

  新增：

  apps/backend/src/modules/retrieval/

  结构：

  retrieval.module.ts

  retrieval.service.ts

  retrieval.types.ts

  retrievers/

  vector.retriever.ts

  keyword.retriever.ts

  fusion/

  rrf.fusion.ts

  context/

  context.builder.ts

  ***

  # 5. Retrieval Flow

  retrieve(query, context)

  步骤：

  1.

  创建Query Embedding

  2.

  Vector召回Top N

  3.

  Keyword召回Top N

  4.

  RRF融合

  5.

  权限过滤

  6.

  生成Context

  ***

  # 6. RRF Algorithm

  公式：

  score(d)=

  Σ 1/(k+rank)

  默认：

  k=60

  ***

  # 7. Permission Filter

  检索结果必须经过：

  KnowledgeRequestContext

  过滤：

  spaceIds

  roles

  permissions

  禁止：

  无权限Chunk进入Context。

  ***

  # 8. Retrieval Result

  返回：

  RetrievalResult:

  chunkId

  documentId

  content

  score

  metadata

  ***

  # 9. Future Extension

  支持：

  - Elasticsearch

  - BGE Reranker

  - Cross Encoder

  - Hybrid Weighting

  - Agent Tool
