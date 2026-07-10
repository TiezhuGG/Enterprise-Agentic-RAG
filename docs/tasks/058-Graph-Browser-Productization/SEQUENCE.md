# TASK-058：Sequence

## 加载流程

```text
进入 Graph 页面
↓
读取 selectedSpaceId / selectedDocumentId
↓
GraphBrowserStore.loadGraph()
↓
graphService.getSpaceGraph() 或 getDocumentGraph()
↓
保存 GraphView
↓
UI 渲染节点、关系、统计信息
```

## 搜索流程

```text
输入节点关键词
↓
提交查询
↓
Space 模式：调用 /spaces/:spaceId/graph?query=xxx
Document 模式：前端在当前 GraphView 内过滤
↓
展示命中的节点和相关关系
```

## 节点展开流程

```text
点击节点
↓
保存 selectedNodeId
↓
选择一跳或二跳
↓
前端按 edge 邻接关系过滤 visible nodes / edges
↓
展示邻居、关系和来源文档
```

## 来源跳转流程

```text
点击关系
↓
显示 source / target / type / documentId
↓
点击查看文档
↓
workbenchStore.selectDocument(documentId)
↓
跳转到文档上下文
```

## 错误流程

```text
Neo4j 未连接或 API 失败
↓
GraphBrowserStore 捕获错误
↓
UI 显示短错误
↓
不影响其他 Workbench 功能
```
