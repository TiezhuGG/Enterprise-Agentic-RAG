# TASK-066：Tags & Categories

## 目标

为 Knowledge Space 内的文档增加轻量分类与标签能力，用于文档管理、搜索过滤、后续批量操作和前端工作台整理。

定位：

```text
Category = Space 内的文档主分类，一篇文档最多一个分类
Tag = Space 内的文档标签，一篇文档可以有多个标签
```

## 禁止项

- 不实现知识本体。
- 不实现 Graph taxonomy。
- 不实现标签推荐。
- 不让 Agent 直接使用标签做推理。
- 不修改 Chunk/Embedding schema。
- 不把标签分类写进完整正文。
- Controller 不访问 Prisma。
- 前端组件不直接 `fetch`。

## 数据库

新增：

```prisma
DocumentCategory
DocumentTag
DocumentTagAssignment
```

修改：

```prisma
Document.categoryId?
```

约束：

- `DocumentCategory` 在同一 Space 内 name 唯一。
- `DocumentTag` 在同一 Space 内 name 唯一。
- `DocumentTagAssignment` 使用 `(documentId, tagId)` 复合主键。
- 删除 Category 后 Document `categoryId` 置空。
- 删除 Tag 后自动删除 tag assignments。

## 后端 API

```text
GET /spaces/:spaceId/categories
POST /spaces/:spaceId/categories
PATCH /categories/:id
DELETE /categories/:id

GET /spaces/:spaceId/tags
POST /spaces/:spaceId/tags
PATCH /tags/:id
DELETE /tags/:id

GET /documents/:id/taxonomy
PATCH /documents/:id/taxonomy
```

权限：

- list/get：`OWNER / EDITOR / VIEWER`
- create/update/delete：`OWNER / EDITOR`
- document taxonomy update：`OWNER / EDITOR`
- document taxonomy read：复用文档 read 权限和 AccessPolicy。

## 前端

新增：

```text
components/workbench/DocumentTaxonomyPanel.tsx
services/taxonomy.service.ts
```

Workbench store 新增：

- `categories`
- `tags`
- `documentTaxonomy`
- `loadTaxonomy(spaceId?)`
- `loadDocumentTaxonomy(documentId?)`
- `createCategory(name)`
- `createTag(name)`
- `updateDocumentTaxonomy(input)`

## 搜索

本任务只做轻量搜索过滤：

- Search API 可接收 `categoryId`、`tagId`。
- 第一版在 retrieval 后按 Document taxonomy 过滤结果。
- 不改变 RRF/Reranker 排序逻辑。

## 验收标准

- Space 内可创建/列出分类和标签。
- Document 可设置一个 category 和多个 tags。
- 切换 Space 时 taxonomy 状态正确刷新。
- Search 可按 category/tag 过滤结果。
- 权限仍走 Space role + AccessPolicy。
- 前端组件不直接 `fetch`。
