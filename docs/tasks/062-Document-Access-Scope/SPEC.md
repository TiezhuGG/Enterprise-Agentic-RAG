# TASK-062：Document Access Scope

## 目标

实现文档级访问范围管理，让企业知识文档可以按安全级别和部门范围控制读取、检索、引用与预览。

本任务建立在 TASK-041/042 的 tenant-aware RBAC 与 AccessPolicy 之上，不再重复实现权限判断，而是补齐文档侧可配置入口。

## 范围

新增文档访问范围：

- `securityLevel`
  - `PUBLIC`
  - `INTERNAL`
  - `CONFIDENTIAL`
- `departmentId`
- `allowedDepartmentIds`

访问范围必须影响：

- 文档列表
- 文档详情
- 文档 metadata
- 文件预览/下载
- Retrieval / Search / Citation
- Chunk metadata / Search index

## 数据结构

在 `Document` 上新增 JSON 字段：

```prisma
accessScope Json @default("{}") @map("access_scope")
```

TypeScript 类型：

```ts
interface DocumentAccessScope {
  securityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  departmentId?: string;
  allowedDepartmentIds?: string[];
}
```

默认值：

```ts
{
  securityLevel: 'INTERNAL';
}
```

## API

新增：

```text
GET /documents/:id/access-scope
PATCH /documents/:id/access-scope
```

PATCH body：

```ts
{
  securityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  departmentId?: string;
  allowedDepartmentIds?: string[];
}
```

权限：

- `OWNER / EDITOR / VIEWER` 可读取 access scope。
- `OWNER / EDITOR` 可修改 access scope。
- `CONFIDENTIAL` 文档读取仍由 `AccessPolicyService` 判断。

## 前端

在文档中心增加访问范围面板：

- 展示当前文档安全级别。
- 展示主归属部门。
- 展示允许访问部门列表。
- `OWNER / EDITOR` 可修改。
- `VIEWER` 只读。

保持调用链：

```text
Component -> Store -> Service -> API
```

## 禁止

- 不做 Document Versioning。
- 不做 Tags / Categories。
- 不做 Role CRUD。
- 不做 Department CRUD。
- 不新增后台权限页面。
- 不让组件直接 `fetch`。
- 不在日志或 metadata 中记录文档正文。

## 验收标准

- 文档可保存 access scope。
- 重新 processing 后 metadata 继承 access scope。
- Chunk metadata 继承 access scope。
- Retrieval/Search 不返回无权限文档。
- 文档详情、预览、metadata 遵守 AccessPolicy。
- 前端可查看和修改访问范围。
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
