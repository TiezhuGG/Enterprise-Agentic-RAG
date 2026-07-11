# TASK-062：ADR

## 决策

将文档访问范围持久化在 `Document.accessScope` JSON 字段，而不是只保存在 `DocumentContent.metadata`。

## 原因

- 文档创建后、解析前也需要能配置访问范围。
- 文档重新解析时，访问范围不应丢失。
- `DocumentContent.metadata` 更适合保存处理产物 metadata，不适合作为唯一权限配置源。
- JSON 字段能快速承载 `securityLevel / departmentId / allowedDepartmentIds`，避免过早设计复杂权限表。

## 边界

`Document.accessScope` 是配置源。

`DocumentContent.metadata` 是检索与引用传播源。

`Chunk.metadata` 和 Search index 继续从 `DocumentContent.metadata` 继承。

## 权限模型

读取：

- 先检查 Space 成员角色。
- 再检查 `AccessPolicyService`。

修改：

- 只允许 `OWNER / EDITOR`。
- 修改 access scope 不直接重写 chunk。
- 重新 ingest 后，新的 scope 会传播到 metadata/chunk/search index。

## 取舍

本任务不为 `Document.accessScope` 建独立表和索引。第一版用 JSON 足够支撑 MVP 与企业边界演示。后续如果需要复杂策略，可以演进为：

- `DocumentAccessRule`
- 用户组
- 项目/客户范围
- 生效时间
- 审批流

## 后果

- 访问范围编辑后，对文档详情/预览立即生效。
- 对已生成 chunk/search index 的检索过滤，建议重新 ingest 使 metadata 同步。
- 前端需要提示用户：修改访问范围后建议重新入库以刷新检索索引。
