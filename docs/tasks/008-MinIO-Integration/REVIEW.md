# TASK-008 Review Checklist

## Infrastructure

- [ ] MinIO Client封装完成

- [ ] StorageService存在

- [ ] Module正确注册

- [ ] Config统一管理

---

## Architecture

- [ ] 业务模块不import MinIO SDK

- [ ] Storage属于Infrastructure

- [ ] Service只暴露抽象API

---

## API

- [ ] uploadObject存在

- [ ] getObject存在

- [ ] deleteObject存在

- [ ] exists存在

---

## Security

- [ ] 不暴露MinIO账号密码

- [ ] 不返回内部endpoint

---

## Future Compatibility

- [ ] 支持Document.storageKey

- [ ] 支持Upload Pipeline

- [ ] 支持S3替换
