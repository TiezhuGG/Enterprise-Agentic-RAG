# TASK-052：Demo Dataset Bootstrap

## 目标

把当前 `demo:seed` 从“上传一个样例文档”升级为“生成完整可问答演示数据集”的一键入口，服务本地测试、服务器部署验证、面试演示和简历项目展示。

## 范围

- 创建或复用演示账号。
- 创建或复用演示租户、组织、部门。
- 创建或复用演示 Knowledge Space。
- 上传多份示例文档。
- 可选自动执行 ingestion。
- 可选开启 Graph extraction。
- 支持 reset，只清理 demo 命名空间，不影响用户真实数据。
- 输出前端登录信息、Space、Document、Conversation、示例问题和 smoke 命令。

## 禁止项

- 不删除非 demo 数据。
- 不新增后台管理 UI。
- 不绕过现有 Service / Repository 业务入口。
- 不把 API key、prompt、answer、文档正文写入报告。
- 不改变 Agent / Retrieval / Ingestion 核心编排。

## 命令

```bash
pnpm demo:seed
pnpm demo:seed --no-ingest
pnpm demo:seed --reset
pnpm demo:seed --graph
pnpm demo:seed --no-graph
pnpm demo:reset
```

## 默认策略

- 默认账号：`admin@example.com`
- 默认密码：`Admin123!`
- 默认 Space：`MVP Demo Space`
- 默认关闭 Graph：`includeGraph=false`
- 默认开启 Embedding：`includeEmbedding=true`
- 默认开启 force：`force=true`
- reset 只软删除 demo Space / demo Conversation，并复用账号和企业组织上下文。

## Dataset

新增多文档样例：

- 报销制度
- 知识库使用规范
- 权限与审批流程

Dataset 元数据包含：

- 文档路径
- title
- description
- mimeType
- 示例问题
- 期望回答提示
- 期望引用提示

## 验收标准

- 一条命令生成可问答 demo Space。
- demo 文档全部上传成功。
- ingest 开启时，支持文档进入 READY。
- chunk、embedding、search index 可生成。
- `--no-ingest` 可只准备数据。
- `--reset` 不影响非 demo 数据。
- 输出可复制的前端登录信息和 demo smoke 命令。
