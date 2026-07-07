# TASK-009 Review Checklist

## Upload Pipeline

- [ ] 支持multipart上传

- [ ] 创建Document

- [ ] 上传MinIO

- [ ] 保存storageKey

- [ ] 更新Document状态

---

## Permission

- [ ] OWNER可以上传

- [ ] EDITOR可以上传

- [ ] VIEWER禁止

---

## Storage

- [ ] 不直接调用MinIO SDK

- [ ] 使用StorageService

---

## File Validation

- [ ] 文件大小限制

- [ ] MIME校验

- [ ] 空文件拒绝

---

## Consistency

- [ ] 上传失败Document变FAILED

- [ ] 无孤儿Object

---

## Architecture

- [ ] Controller无业务

- [ ] Service无Prisma

- [ ] Repository负责数据库

---

## Future AI Pipeline

- [ ] 状态支持Parser

- [ ] 支持Chunk Pipeline

- [ ] 支持Embedding Pipeline
