# TASK-010 Document Processing Pipeline Implementation

你是 Enterprise Agentic RAG 项目的后端架构工程师。

严格遵守现有DDD架构。

=========================

目标

=========================

实现Document解析流水线。

输入：

Document(PROCESSING)

输出：

DocumentContent Markdown

并推进：

PROCESSING

↓

READY

=========================

禁止

=========================

不要实现：

❌ Chunk

❌ Embedding

❌ Vector Search

❌ Elasticsearch

❌ OCR

❌ ASR

❌ Video Understanding

❌ Agent

=========================

新增目录

创建：

apps/backend/src/modules/document-processing/

结构：

document-processing.module.ts

document-processing.service.ts

document-processing.controller.ts(可选)

document-parser.interface.ts

parser.factory.ts

parsers/

pdf.parser.ts

docx.parser.ts

txt.parser.ts

markdown.parser.ts

=========================

新增Entity

DocumentContent

字段：

id

documentId

content

createdAt

updatedAt

Document:

1:1

=========================

处理流程

实现：

processDocument(documentId)

步骤：

1.

读取Document

2.

获取storageKey

3.

StorageService.getObject()

4.

ParserFactory选择Parser

5.

生成Markdown

6.

保存DocumentContent

7.

Document状态READY

=========================

失败处理

任何异常：

Document.status=FAILED

记录日志

=========================

Parser要求

统一接口：

interface DocumentParser {

supports(type)

parse(buffer)

}

=========================

依赖限制

允许：

pdf-parse

mammoth

禁止：

直接调用MinIO SDK

禁止：

process.env

=========================

验证要求

完成后测试：

1.

上传PDF

2.

调用processDocument

3.

检查DocumentContent

4.

检查Markdown内容

5.

检查Document状态READY

输出：

1.

新增目录结构

2.

Parser设计

3.

处理流程

4.

测试结果

5.

未来如何接Chunk Pipeline
