# TASK-011 Semantic Chunking Pipeline Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格遵守当前DDD架构。

=========================

目标

=========================

实现Document Markdown内容分块。

输入：

DocumentContent.content

输出：

Chunk集合

=========================

禁止

=========================

不要实现：

❌ Embedding

❌ Vector Database

❌ Elasticsearch

❌ Retrieval

❌ Agent

=========================

新增模块

创建：

apps/backend/src/modules/chunk/

结构：

chunk.module.ts

chunk.service.ts

chunk.repository.ts

chunk.entity.ts

chunk.types.ts

splitters/

markdown-header.splitter.ts

token.splitter.ts

=========================

数据库

新增：

Chunk

字段：

id

documentId

content

sequence

tokenCount

metadata

createdAt

updatedAt

关系：

Document

1:N

Chunk

=========================

处理流程

实现：

processChunks(documentId)

步骤：

1.

读取DocumentContent

2.

删除旧Chunk

3.

Markdown Header Split

4.

Token Split

5.

计算token数量

6.

生成metadata

7.

批量保存Chunk

=========================

Chunk规则

默认：

chunkSize:

500 tokens

overlap:

100 tokens

=========================

Metadata

必须包含：

documentId

sequence

sectionTitle

=========================

Architecture Rules

禁止：

Controller访问Prisma

Service直接写SQL

读取MinIO

必须：

ChunkService

↓

ChunkRepository

=========================

验证要求

完成后测试：

1.

上传PDF

2.

Processing

3.

生成DocumentContent

4.

执行Chunk

5.

检查Chunk数量

6.

检查sequence

7.

检查metadata

输出：

1.

新增目录结构

2.

Chunk设计

3.

切分策略

4.

测试结果

5.

未来Embedding如何接入
