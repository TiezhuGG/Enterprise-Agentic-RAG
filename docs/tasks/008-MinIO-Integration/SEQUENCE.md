# TASK-008 Sequence Design

# 1. Upload Object Flow

Future TASK-009 使用：

UploadController

|

StorageService

|

MinIOClient

|

MinIO Server

返回：

objectKey

---

# 2. Download Object Flow

Business Service

|

StorageService

|

MinIOClient

|

MinIO Server

返回：

Buffer

---

# 3. Delete Object Flow

Business Service

|

StorageService

|

MinIOClient

|

MinIO Server

删除对象
