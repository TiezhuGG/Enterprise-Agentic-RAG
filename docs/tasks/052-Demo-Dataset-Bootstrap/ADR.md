# TASK-052：架构决策

## 决策 1：继续使用现有 Service 编排

`demo:seed` 复用 `KnowledgeSpaceService`、`UploadService`、`IngestionService`、`ConversationService`，避免直接绕过业务规则。

后果：

- demo 数据创建过程更接近真实用户行为。
- 权限、tenant、document status、pipeline event 都能自然生效。

## 决策 2：reset 只处理 demo 命名空间

reset 不做数据库清库，只软删除 demo Space 和 demo Conversation。

后果：

- 本地和服务器上可以安全重复执行。
- 历史 pipeline/event/object 可能保留，但不会影响演示 Space。

## 决策 3：Dataset 使用本地 JSON + Markdown

第一版不引入远程样例数据下载，所有示例资料放在 `docs/demo/`。

后果：

- 部署环境无需额外网络。
- 简历展示和面试讲解可以直接引用仓库内样例。

## 决策 4：默认关闭 Graph

Graph extraction 依赖 LLM 和 Neo4j，演示变量更多。因此默认 `--no-graph`，需要完整 GraphRAG 时显式 `--graph`。

后果：

- 默认路径更稳。
- Graph 能力仍可通过参数开启。

## 决策 5：脚本输出结构化 JSON

输出机器可读 summary，便于复制命令、记录部署结果和后续接 CI smoke。

后果：

- 前端登录信息、问题、ID、命令更清晰。
- 不在日志中泄露正文或 secret。
