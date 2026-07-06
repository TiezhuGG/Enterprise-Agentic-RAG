## 存设计文档

# TASK-007 Sequence Design

# 1. Create Document

User

|

POST /spaces/:spaceId/documents

|

DocumentController

|

DocumentService

|

ExecutionContextService

|

检查用户Space权限

|

DocumentRepository

|

Prisma

|

Database

返回：

Document

---

# 2. Query Documents

User

|

GET /spaces/:spaceId/documents

|

Controller

|

Service

|

ExecutionContext

获取：

spaceIds

|

Repository

过滤：

spaceId IN allowed spaces

|

Database

返回：

Document List

---

# 3. Delete Document

User

|

DELETE /documents/:id

|

Controller

|

Service

|

检查：

SpaceMemberRole == OWNER

|

Repository

|

Soft Delete

status = ARCHIVED
