# TASK-058：Graph Browser Productization

## 目标

把现有“图谱是否存在”的静态展示，升级为可浏览、可筛选、可跳转的知识图谱浏览器。

## 核心能力

- 节点搜索。
- 节点类型过滤。
- 一跳 / 二跳关系展开。
- 点击节点查看详情。
- 点击关系查看来源文档。
- 从关系或节点跳转到对应文档。
- 空状态、错误状态和图谱未就绪提示。

## 范围

本任务优先复用现有 API：

```text
GET /spaces/:spaceId/graph
GET /documents/:id/graph
```

第一版不新增后端 API。节点展开在前端对已加载 GraphView 做邻接过滤。

## 前端新增

```text
apps/frontend/components/graph-browser/
apps/frontend/store/graph-browser.store.ts
```

复用：

- `services/graph.service.ts`
- `types/graph.ts`
- `workbench.store.ts`

## 架构边界

必须：

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
- Graph Browser 直接访问 Neo4j。
- 前端绕过 spaceId 权限过滤。
- 展示无权限文档内容。

## 验收标准

- Console 图谱页面使用新的 GraphBrowser。
- Space 图谱可加载。
- Document 图谱可加载。
- 节点搜索生效。
- 节点类型过滤生效。
- 点击节点可查看一跳 / 二跳邻居。
- 点击关系可查看来源文档，并可跳转选中文档。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
