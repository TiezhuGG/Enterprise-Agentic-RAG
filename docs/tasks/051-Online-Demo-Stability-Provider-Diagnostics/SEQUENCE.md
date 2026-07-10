# TASK-051 Sequence

## Readiness 流程

```text
GET /health/readiness
↓
基础设施检查
  database / redis / storage / graph / vector / search
↓
provider 诊断
  llm configuration -> inference
  embedding configuration -> inference + dimension
  reranker configuration -> inference
  ocr/asr/video configuration
↓
返回 status + checks
```

## Provider Smoke 流程

```text
pnpm provider:smoke
↓
创建 Nest ApplicationContext
↓
调用 ReadinessService deep diagnostics
↓
生成 JSON + Markdown 报告
↓
只输出 endpoint/model/status/code/message
```

## 错误流程

### LLM 不可用

```text
LlmProvider.chat/stream
↓
fetch failed / non-2xx / invalid response
↓
throw ServiceUnavailableException({ code: 'LLM_UNAVAILABLE', message: '大模型服务不可用' })
↓
前端展示中文错误
```

### Embedding 不可用

```text
EmbeddingProvider.embed
↓
fetch failed / non-2xx / invalid vector / dimension mismatch
↓
throw ServiceUnavailableException({ code: 'EMBEDDING_UNAVAILABLE', message: '向量模型不可用' })
↓
Pipeline event errorMessage 写入中文业务原因
```

### Reranker 不可用

```text
RerankerProvider.rerank
↓
fetch failed / non-2xx / invalid score
↓
throw ServiceUnavailableException({ code: 'RERANKER_UNAVAILABLE', message: '重排序服务不可用' })
```

### 文件格式不支持

```text
UploadService / ParserFactory
↓
unsupported file type
↓
throw BadRequestException({ code: 'UNSUPPORTED_FILE_TYPE', message: '文件格式暂不支持' })
```

## 安全规则

- 诊断输入使用固定短文本，不写入报告。
- 错误 message 只保留业务化描述。
- 报告不包含 token、key、password、prompt、answer、document content。
