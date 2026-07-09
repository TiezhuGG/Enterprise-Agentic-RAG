# TASK-050：流程

## Demo 准备流程

1. 复制 `.env.example` 为 `.env` 并填写 provider 配置。
2. 启动基础设施。
3. 执行数据库迁移和 seed。
4. 执行 `pnpm demo:seed` 准备样例 Space、Document、Conversation。
5. 执行 `pnpm provider:smoke` 生成 readiness 报告。
6. 启动 backend / frontend。
7. 打开 Workbench 演示。

## 录屏流程

1. 展示 System Readiness。
2. 登录 admin 用户。
3. 展示 Space、Document、Pipeline Timeline。
4. 执行 Agent Debug 问答。
5. 展示 Citations、Trace、Metrics、Execution Timeline。
6. 结尾展示 README 架构图与部署命令。

## 失败处理

- provider 不可用时，readiness 显示 degraded。
- Graph 服务不可用时，demo 可以使用 `--no-graph` 或默认 `demo:seed` 的 graph-disabled 路径。
- Embedding 不可用时，RAG 检索不可闭环，应先修复 provider 配置。
