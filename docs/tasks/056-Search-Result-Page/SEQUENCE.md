# TASK-056：Sequence

## 初始化流程

```text
打开 Console 或 Demo Workbench
↓
读取当前 auth token
↓
读取 Workbench 当前 selectedSpaceId
↓
Search Center 初始化查询参数
```

## 搜索流程

```text
用户输入 query
↓
选择搜索模式、文档类型、排序和 limit
↓
Component 调用 SearchStore.search()
↓
SearchStore 调用 SearchService
↓
SearchService 请求 /search/{mode}
↓
后端返回 SearchResponse
↓
Store 保存 results、breakdown、history
↓
UI 渲染结果列表和检索分解
```

## 全局搜索流程

```text
顶部搜索框输入 query
↓
写入 SearchStore.query
↓
跳转 Search section
↓
如果已有 selectedSpaceId，自动触发搜索
```

## 错误流程

```text
API 失败
↓
SearchService 抛出 ApiClientError
↓
SearchStore 转换为安全短错误
↓
Search Center 显示中文错误
```

错误信息不得展示：

- API key
- JWT token
- prompt
- answer
- document full content

## 空状态

- 未登录：提示先登录。
- 未选择 Space：提示先选择知识空间。
- query 为空：提示输入关键词或业务问题。
- 结果为空：提示换关键词、检查文档是否 READY。
