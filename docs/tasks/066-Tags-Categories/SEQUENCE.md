# TASK-066：Sequence

## 创建分类

```text
User
-> POST /spaces/:spaceId/categories
-> TaxonomyController
-> TaxonomyService.ensureSpaceRole(OWNER/EDITOR)
-> TaxonomyRepository.createCategory
-> return Category
```

## 创建标签

```text
User
-> POST /spaces/:spaceId/tags
-> TaxonomyController
-> TaxonomyService.ensureSpaceRole(OWNER/EDITOR)
-> TaxonomyRepository.createTag
-> return Tag
```

## 设置文档分类标签

```text
User
-> PATCH /documents/:id/taxonomy
-> TaxonomyController
-> TaxonomyService.find document
-> ensure Space role OWNER/EDITOR
-> validate category/tag belongs to same Space
-> TaxonomyRepository.updateDocumentTaxonomy
-> return DocumentTaxonomy
```

## 读取文档分类标签

```text
User
-> GET /documents/:id/taxonomy
-> TaxonomyService.find document
-> ensure Space role OWNER/EDITOR/VIEWER
-> AccessPolicy read check
-> TaxonomyRepository.getDocumentTaxonomy
-> return category + tags
```

## 搜索过滤

```text
Search API
-> RetrievalService
-> Candidate chunks
-> load document taxonomy
-> filter by categoryId/tagId
-> sort/paginate
-> return results
```

说明：第一版是后过滤，优点是改动小；缺点是极端情况下 candidate 数量不足，后续可在 Search infra/index metadata 中提前过滤。

## 错误流程

- 分类/标签名称为空：400。
- 分类/标签不属于同一 Space：400。
- 文档不存在：404。
- 无 Space 权限：403 或 404。
- 重复名称：数据库唯一约束返回错误。
