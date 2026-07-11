# TASK-063：Sequence

## 创建 Space

```text
Frontend SpaceSwitcher / Admin
-> WorkbenchStore.createSpace(name, profile)
-> KnowledgeSpaceService.create()
-> POST /spaces
-> KnowledgeSpaceController
-> KnowledgeSpaceService
-> KnowledgeSpaceRepository.create()
-> Prisma KnowledgeSpace.type + metadata
-> return KnowledgeSpace
```

## 更新 Space Profile

```text
Frontend SpaceProfilePanel
-> WorkbenchStore.updateSelectedSpaceProfile()
-> KnowledgeSpaceService.update()
-> PATCH /spaces/:id
-> KnowledgeSpaceController
-> KnowledgeSpaceService.ensureMemberRole(OWNER/EDITOR)
-> KnowledgeSpaceRepository.update()
-> return KnowledgeSpace
```

## 查询 Space

```text
GET /spaces
-> tenant filter
-> member filter
-> return spaces with type and metadata
```

## 错误流程

### 非成员访问

```text
findAccessibleById()
-> null
-> 404 Knowledge space not found
```

### VIEWER 修改

```text
ensureMemberRole(writeRoles)
-> 403 Insufficient knowledge space role
```

### 非法类型

```text
DTO validation
-> 400
```

### metadata 字段过长

```text
DTO validation
-> 400
```

## 与后续任务关系

TASK-063 只提供空间类型和业务归属。后续任务可基于它扩展：

- Space member 管理策略。
- 项目/客户独立模型。
- 文档默认 access scope。
- 搜索和图谱按 Space type 筛选。
