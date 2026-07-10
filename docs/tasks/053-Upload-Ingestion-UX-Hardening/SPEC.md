# TASK-053：Upload & Ingestion UX Hardening

## 目标

让用户在前端清楚理解文档上传、解析、入库、失败和可检索状态，减少“只看到 HTTP error 或英文状态”的演示断点。

## 范围

- 文档状态中文化。
- Ingestion 面板显示更明确的当前状态。
- Pipeline Timeline 使用中文阶段名和阶段状态。
- 失败原因业务化展示。
- 上传后、ingest 成功后、ingest 失败后都自动刷新文档状态和 Pipeline events。

## 禁止项

- 不新增后端领域能力。
- 不新增数据库表。
- 不实现后台管理 UI。
- 不展示完整文档正文、prompt、answer、API key。
- 不让组件直接 fetch。
- 不改变现有 Upload / Ingestion / Pipeline API。

## 状态文案

Document：

- CREATED：待解析
- PROCESSING：解析中
- READY：可检索
- FAILED：解析失败
- ARCHIVED：已归档

Pipeline stage：

- validate：文件校验
- document-processing：解析与清洗
- chunking：语义分块与索引
- embedding：向量生成
- graph-extraction：图谱抽取
- done：完成入库

业务错误：

- 文件格式暂不支持
- 大模型服务不可用
- 向量模型不可用
- 重排序服务不可用
- 图谱服务未连接
- 向量生成失败
- 搜索索引失败
- 图谱抽取失败

## 验收标准

- 上传 TXT/PDF/Markdown 后，用户能看到文档状态变化。
- Ingest 运行中有明确中文状态。
- Pipeline Timeline 阶段名可读。
- 失败时展示中文业务原因。
- Ingest 失败后也刷新最新文档状态和 pipeline events。
- READY 后可以直接进入搜索/问答。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
