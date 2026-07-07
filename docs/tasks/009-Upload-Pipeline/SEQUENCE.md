# TASK-009 Sequence Design

# 1. Upload Success Flow

User

|

POST multipart upload

|

UploadController

|

UploadService

|

检查：

ExecutionContext

|

检查：

SpaceMember Role

|

DocumentRepository

创建Document

status=CREATED

|

ObjectKeyGenerator

生成key

|

StorageService

|

MinIO

上传文件

|

DocumentRepository

更新：

storageKey

status=PROCESSING

返回Document

---

# 2. Upload Failed Flow

User

|

UploadController

|

UploadService

|

Create Document

|

StorageService

|

MinIO Error

|

DocumentRepository

update:

status=FAILED

返回错误

---

# 3. Future Extension

PROCESSING

↓

Message Queue

↓

Parser Worker

↓

READY
