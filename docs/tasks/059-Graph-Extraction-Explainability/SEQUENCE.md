# TASK-059：Sequence

## 成功流程

```text
用户上传文档
-> 点击 Ingest 并启用 includeGraph
-> document-processing
-> chunking
-> embedding
-> graph-extraction
-> EntityExtractor
-> RelationExtractor
-> Neo4j saveDocumentGraph
-> PipelineEvent metadata 写入 counts/type distribution
-> done
-> Document READY
-> Graph Browser 展示抽取结果
```

## 跳过流程

```text
用户关闭 includeGraph
-> graph-extraction stage = SKIPPED
-> metadata.reason = includeGraph=false
-> Document READY
-> Graph Browser 显示“本次未启用图谱抽取”
```

## 失败降级流程

```text
用户启用 includeGraph
-> graph-extraction 调用失败
-> PipelineEvent status = FAILED
-> metadata.graphExtractionStatus = failed
-> errorMessage 保存安全短错误
-> 继续执行 done
-> Document READY
-> Graph Browser 显示图谱失败原因
```

## 安全流程

```text
Graph provider 抛错
-> PipelineService.sanitizeMetadata()
-> 不写入 prompt / answer / content / token / key
-> 前端只展示安全错误摘要
```
