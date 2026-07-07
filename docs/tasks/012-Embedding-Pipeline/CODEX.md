# TASK-012 Embedding Pipeline Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格遵守DDD架构。

=========================

目标

=========================

实现Chunk向量化流水线。

输入：

Chunk.content

输出：

ChunkEmbedding

=========================

禁止实现

=========================

不要实现：

❌ Retrieval

❌ Search API

❌ BM25

❌ Elasticsearch

❌ Reranker

❌ Agent

=========================

新增目录

创建：

apps/backend/src/modules/embedding/

结构：

embedding.module.ts

embedding.service.ts

embedding.types.ts

providers/

embedding.provider.ts

openai-compatible.provider.ts

=========================

创建基础设施：

apps/backend/src/infrastructure/vector/

结构：

vector.module.ts

vector.service.ts

vector.client.ts

vector.types.ts

=========================

数据库

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

1:1

ChunkEmbedding

=========================

Provider设计

创建接口：

EmbeddingProvider

方法：

embed(text:string): Promise<number[]>

EmbeddingService禁止直接调用模型SDK。

=========================

实现第一版Provider

OpenAI Compatible

配置来源：

ConfigService

新增配置：

EMBEDDING_API_URL

EMBEDDING_API_KEY

EMBEDDING_MODEL

EMBEDDING_DIMENSION

=========================

实现流程

新增：

processEmbedding(documentId)

步骤：

1.

查询Document所有Chunk

2.

删除旧Embedding

3.

调用EmbeddingProvider

4.

生成vector

5.

保存ChunkEmbedding

=========================

架构要求

必须：

EmbeddingService

↓

EmbeddingProvider

VectorService

↓

VectorClient

=========================

禁止：

Service直接调用Prisma

业务模块直接调用pgvector

=========================

测试要求

完成后验证：

1.

上传PDF

2.

生成DocumentContent

3.

生成Chunk

4.

执行Embedding

5.

检查ChunkEmbedding数量

6.

检查vector长度

7.

检查chunk关联

输出：

1.

新增目录结构

2.

Embedding设计

3.

Provider设计

4.

Vector设计

5.

测试结果

6.

未来Retrieval如何接入
