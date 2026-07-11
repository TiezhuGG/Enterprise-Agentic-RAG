# TASK-063：Department / Project / Customer Space Type

## 目标

让 Knowledge Space 支持企业业务空间类型，用于区分通用知识库、部门知识库、项目知识库和客户知识库。

本任务只做 Space 的类型化与轻量业务归属 metadata，不引入 Project / Customer 独立领域模型。

## Space 类型

新增：

```ts
type KnowledgeSpaceType = 'GENERAL' | 'DEPARTMENT' | 'PROJECT' | 'CUSTOMER';
```

语义：

- `GENERAL`：通用知识空间。
- `DEPARTMENT`：部门知识空间。
- `PROJECT`：项目知识空间。
- `CUSTOMER`：客户知识空间。

## 数据库

修改 `KnowledgeSpace`：

```prisma
type     KnowledgeSpaceType @default(GENERAL)
metadata Json               @default("{}")
```

metadata 第一版支持：

```ts
interface KnowledgeSpaceMetadata {
  departmentId?: string;
  projectCode?: string;
  projectName?: string;
  customerCode?: string;
  customerName?: string;
  ownerDepartmentId?: string;
}
```

## API

扩展现有 API：

```text
POST /spaces
PATCH /spaces/:id
GET /spaces
GET /spaces/:id
```

请求字段：

```ts
{
  type?: KnowledgeSpaceType;
  metadata?: KnowledgeSpaceMetadata;
}
```

权限：

- 创建者为 OWNER。
- `OWNER / EDITOR` 可更新空间类型和 metadata。
- 空间查询继续遵守 tenant + member 过滤。

## 前端

扩展：

- Space 创建时可选择类型。
- Space 列表/当前空间展示类型 badge。
- 新增 Space Profile 面板，允许 OWNER/EDITOR 修改类型和 metadata。

保持调用链：

```text
Component -> Store -> Service -> API
```

## 禁止

- 不实现 Project CRUD。
- 不实现 Customer CRUD。
- 不实现 Department CRUD。
- 不改变 Retrieval 权限过滤。
- 不把 space type 当作权限边界。
- 不让组件直接 `fetch`。

## 验收标准

- 新建 Space 可保存 type/metadata。
- 更新 Space 可修改 type/metadata。
- Space 列表返回 type/metadata。
- Demo/Admin 前端可展示和编辑 Space 类型。
- 不破坏当前 Space member、document、ingestion、retrieval。
- `pnpm db:validate`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
