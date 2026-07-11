# TASK-063：ADR

## 决策

在 KnowledgeSpace 上增加强类型字段 `type`，业务归属放入 `metadata` JSON。

## 原因

- Space type 是产品级主维度，适合强类型字段。
- project/customer 目前只是演示 MVP 所需归属信息，不适合过早创建完整领域。
- JSON metadata 能支持快速演进，避免在 TASK-063 横向扩张。

## 为什么不新建 Project / Customer 表

当前项目重点是 Enterprise Agentic RAG 的知识入库、检索、Agent 和可演示闭环。

Project / Customer 独立模型会引入：

- CRUD。
- 成员关系。
- 生命周期状态。
- 审计。
- 与 Space 的同步规则。

这些都超出 TASK-063 范围。

## 权限边界

Space type 不参与权限判断。

权限仍由：

- tenant
- Space member role
- Document access scope
- AccessPolicy

共同决定。

## 后果

- 前端可以更清晰展示“部门/项目/客户知识空间”。
- demo 数据和简历描述更贴近企业知识库产品。
- 后续可平滑演进到正式 Project/Customer 模型。
