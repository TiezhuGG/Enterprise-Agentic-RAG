# TASK-055：执行流程

## Fulltext

```text
GET /search/fulltext?q=...
↓
JwtAuthGuard
↓
RequestContextService
↓
SearchService.searchFulltext
↓
RetrievalService(mode=keyword)
↓
KeywordRetriever
↓
Elasticsearch / PostgreSQL FTS fallback
↓
Permission filter
↓
Document source enrichment
↓
SearchResponse
```

## Semantic

```text
GET /search/semantic?q=...
↓
SearchService.searchSemantic
↓
RetrievalService(mode=vector)
↓
EmbeddingProvider
↓
VectorService / pgvector
↓
Permission filter
↓
Document source enrichment
↓
SearchResponse
```

## Hybrid

```text
GET /search/hybrid?q=...
↓
SearchService.searchHybrid
↓
RetrievalService(mode=hybrid)
↓
Vector + Keyword + Graph
↓
Permission filter
↓
RRF
↓
Reranker
↓
Document source enrichment
↓
SearchResponse
```

## 错误流程

- `q` 为空：400。
- limit / offset 非法：400。
- 用户无检索权限：返回空结果，不泄露数据。
- provider 不可用：返回已有统一错误码和中文错误信息。

## 分页流程

第一版为 lightweight offset：

```text
retrieval limit = offset + limit
↓
返回 slice(offset, offset + limit)
```

后续 Elasticsearch / PGVector 深分页再单独优化。
