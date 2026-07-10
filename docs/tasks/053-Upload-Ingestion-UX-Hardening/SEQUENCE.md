# TASK-053：执行流程

## 上传成功流程

```text
用户选择文件
↓
DocumentUploadPanel
↓
workbench.store.uploadDocument()
↓
upload.service
↓
刷新 document list
↓
选中新文档
↓
刷新 ingestion status / pipeline jobs
```

## Ingestion 成功流程

```text
点击开始入库
↓
workbench.store.ingestSelectedDocument()
↓
ingestion.service.ingestDocument()
↓
刷新 ingestion status
↓
刷新 documents
↓
选中当前 document
↓
刷新 pipeline events
↓
显示 READY / 可检索
```

## Ingestion 失败流程

```text
ingestDocument 抛错
↓
转换为中文业务错误
↓
尝试读取 ingestion status
↓
刷新 document list
↓
重新选择当前 document
↓
刷新 pipeline events
↓
显示失败阶段和中文原因
```

## 空状态流程

- 未选择 Space：提示先创建或选择知识空间。
- 没有 Document：提示上传 demo 文档。
- 没有 Pipeline Event：提示运行入库。
- Metadata 不存在：提示需要处理完成。

## 错误归因

错误归因优先级：

1. 后端结构化错误码。
2. Pipeline stage。
3. 错误消息关键词。
4. 通用 fallback。
