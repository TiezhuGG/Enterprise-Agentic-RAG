# TASK-066：ADR

## 决策一：分类和标签是 Space 级资源

分类和标签归属于 Knowledge Space，而不是全局租户资源。

原因：

- 不同 Space 的业务语义不同。
- MVP 阶段避免全局标签治理复杂度。
- Space member 权限可以直接复用。

## 决策二：Category 一对多，Tag 多对多

一篇文档最多一个分类，可以有多个标签。

原因：

- 分类用于主导航和组织结构。
- 标签用于灵活交叉筛选。

## 决策三：不修改 Chunk/Embedding schema

本任务不把 tag/category 下沉到 Chunk。

原因：

- 当前检索链路已稳定。
- 标签分类属于文档管理元数据，先做后过滤即可满足 MVP。

后果：

- 搜索过滤第一版发生在候选结果之后。
- 后续如需大规模精准过滤，可在 Search index 和 Chunk metadata 中同步 taxonomy。

## 决策四：独立 Taxonomy 模块

新增 `modules/taxonomy`，而不是继续扩大 DocumentService。

原因：

- 分类和标签有自己的 Space 级生命周期。
- 可以保持 DocumentService 关注文档主体、预览、版本和访问范围。
