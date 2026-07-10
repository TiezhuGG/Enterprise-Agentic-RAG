# TASK-056：Search Result Page

## 目标

在前端新增产品化搜索中心，让用户可以不经过 Agent 问答，直接调用 TASK-055 的 Search API 查看全文、语义、混合检索结果。

## 新增能力

- 新增 `services/search.service.ts`。
- 新增 `types/search.ts`。
- 改造 `store/search.store.ts`，从 Agent 流式问答改为调用 Search API。
- 新增 `components/search/`，提供可复用 Search Center。
- 在 Demo Workbench 中新增 `Search` tab。
- 在现有 Console 搜索中心中复用同一组件。

## API

前端必须消费：

```text
GET /search/fulltext
GET /search/semantic
GET /search/hybrid
```

查询参数：

```text
q
spaceId?
documentType?
limit?
offset?
sort?
```

## UI 要求

- 支持搜索模式切换：全文、语义、混合。
- 支持 Space 过滤，默认使用当前选中的 Space。
- 支持文件类型过滤。
- 支持排序：相关度、更新时间。
- 展示来源文档、chunk 内容、score、metadata。
- 展示 retrieval breakdown。
- 支持结果为空、未登录、未选择 Space、请求失败等状态。

## 架构边界

必须保持：

```text
Component
↓
Store
↓
Service
↓
API
```

禁止：

- React 组件直接 `fetch`。
- 搜索页调用 Agent API。
- 搜索页展示完整 DocumentContent。
- 搜索页展示 token、API key、prompt、answer。

## 验收标准

- Search Center 可独立搜索。
- Console 搜索入口和 Demo Workbench 搜索入口复用同一组件。
- 全文、语义、混合模式都能发起请求。
- 结果展示包含来源文档、片段、score、metadata。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
