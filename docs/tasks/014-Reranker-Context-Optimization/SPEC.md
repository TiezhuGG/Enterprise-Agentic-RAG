# TASK-014 Reranker Context Optimization Specification

# 1. Overview

本任务在Hybrid Retrieval之后增加Reranker层。

目标：

提升召回结果准确率。

Pipeline:

Query

↓

Hybrid Retrieval

↓

RRF

↓

Reranker

↓

Context Builder

---

# 2. Architecture

RetrievalService

      |

RrfFusion

      |

RerankerService

      |

ContextBuilder

---

# 3. Module Structure

新增：

apps/backend/src/modules/reranker/

结构：

reranker.module.ts

reranker.service.ts

reranker.types.ts

providers/

reranker.provider.ts

bge-reranker.provider.ts

---

# 4. Provider Pattern

统一接口：

interface RerankerProvider {

rerank(

query:string,

documents:RerankDocument[]

):Promise<RerankScore[]>

}

业务层不知道：

- BGE
- Cohere
- Jina
- OpenAI

---

# 5. Rerank Flow

Input:

query:

"员工离职流程"

documents:

[
{
chunkId,
content
}
]

↓

RerankerProvider

↓

scores:

[
{
chunkId,
score:0.92
}
]

---

# 6. Candidate Strategy

RRF输出：

Top 20

进入Reranker

输出：

Top 5

---

# 7. Context Optimization

ContextBuilder增加：

Token Budget

默认：

MAX_CONTEXT_TOKENS=3000

策略：

按照rerank score排序

依次加入chunk

直到超过token预算

---

# 8. Context Result

ContextChunk:

chunkId

documentId

content

score

metadata

---

# 9. Configuration

新增：

RERANKER_API_URL

RERANKER_API_KEY

RERANKER_MODEL

RERANKER_TOP_K

MAX_CONTEXT_TOKENS

---

# 10. Future Extension

支持：

- CrossEncoder

- Local GPU Model

- Batch rerank

- Multi query retrieval
