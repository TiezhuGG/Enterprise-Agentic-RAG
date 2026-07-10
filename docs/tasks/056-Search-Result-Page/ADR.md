# TASK-056：ADR

## 决策

使用独立 Search Center 组件消费 TASK-055 Search API，而不是复用 Agent Debug 或 Chat UI。

## 原因

- Search API 是产品能力，不应依赖 Agent 执行。
- 用户需要先查看命中文档和片段，再决定是否让 AI 总结。
- Search Result Page 是后续 citation deep link、文档预览、GraphRAG 路径展示的基础。

## Store 设计

`search.store.ts` 负责：

- 查询参数状态。
- 请求状态。
- 搜索结果。
- retrieval breakdown。
- 搜索历史。

组件只读写 store，不直接请求 API。

## 结果展示策略

- 展示 chunk 片段，而不是完整文档正文。
- metadata 只展示安全摘要字段。
- score 使用小数格式展示。
- document source 缺失时展示 fallback，不阻断结果。

## 取舍

- 第一版不做关键词高亮的复杂分词，只做大小写无关的简单 substring 高亮。
- 第一版不做 URL query 持久化，后续可接入路由参数。
- 第一版不做服务端分页总数精确统计，使用当前 Search API 返回的候选总数。

## 后果

- TASK-057 可以在此基础上做 citation deep link。
- TASK-058 可以补图谱浏览器入口。
- TASK-060 可以让搜索结果标记 vector / keyword / graph 来源。
