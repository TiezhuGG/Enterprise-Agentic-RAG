# TASK-032：流程设计

## Workbench 初始化

```text
DemoWorkbench mount
↓
WorkbenchStore.initialize()
DemoStore.initialize()
↓
加载 token / spaces / readiness
↓
渲染 sidebar readiness + guide + 当前 tab
```

## Readiness 流程

```text
SystemReadinessPanel mount
↓
DemoStore.initialize()
↓
systemService.getReadiness()
↓
GET /health
GET /metrics
↓
解析 health 和关键 metrics 是否存在
↓
写入 readiness / lastCheckedAt
```

## Checklist 流程

Checklist 不直接请求 API，只根据已有 store 状态计算：

```text
authToken
health/readiness
selectedSpaceId
documents
selectedDocument
ingestionStatus / document status
activeTab
```

输出：

- status
- label
- detail

## Pipeline 空状态

```text
无 Space
↓
显示 DemoEmptyState：选择或创建 Space

有 Space 但无 Document
↓
显示 DemoEmptyState：上传 sample policy

有 Document 但无 Pipeline Event
↓
显示 DemoEmptyState：运行 Ingestion

无 Metadata
↓
显示 DemoEmptyState：等待 Processing 完成
```

## Agent Debug 示例问题

```text
点击示例问题
↓
AgentDebugStore.setQuestion(question)
↓
不自动 run
```

示例问题必须和 `docs/demo/sample-policy.md` 语义匹配。

## 错误流程

```text
/health 或 /metrics 请求失败
↓
DemoStore.error = 短错误
↓
readiness = degraded
↓
SystemReadinessPanel 显示 degraded
```

```text
业务 API 请求失败
↓
对应 store.error
↓
组件展示短错误
```

禁止展示：

- API key
- 完整 prompt
- 完整 document content
- Memory 原文
