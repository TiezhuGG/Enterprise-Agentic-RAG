# TASK-052：执行流程

## 正常流程

```text
读取参数
↓
加载 sample dataset
↓
创建或复用演示企业上下文
↓
创建或复用演示账号
↓
创建 ExecutionContext
↓
创建或复用 Knowledge Space
↓
上传或复用 dataset 文档
↓
可选执行 ingest
↓
创建或复用 Demo Conversation
↓
输出 JSON summary
```

## Reset 流程

```text
读取参数 --reset
↓
定位 demo 用户与 demo space
↓
软删除 demo conversation
↓
软删除 demo space
↓
继续执行正常 seed 流程
```

reset 不做全库清空，不删除非 demo 用户，不删除非 demo space。

## Ingestion 流程

```text
Document upload
↓
IngestionService.ingestDocument()
↓
document-processing
↓
chunking
↓
embedding
↓
graph-extraction（可选）
↓
done
```

默认 `includeGraph=false`，用于稳定演示；用户显式传入 `--graph` 时才开启。

## 错误流程

- 缺少 sample 文件：脚本失败，并输出缺失路径。
- 模型不可用：ingest 阶段失败，并在 summary 中体现失败原因。
- 单个文档失败：记录到 summary，不阻止其他文档继续处理。
- 权限不足：脚本失败，说明 demo user / enterprise context 需要修复。

## 输出流程

脚本输出 JSON，不输出正文内容：

```json
{
  "login": {},
  "space": {},
  "documents": [],
  "conversation": {},
  "questions": [],
  "commands": {}
}
```
