# TASK-050：架构决策

## 决策

TASK-050 只做 demo、部署和表达收口，不继续扩展业务功能。

## 原因

- 当前系统已经覆盖 MVP 所需的 Knowledge Space、Document Pipeline、Hybrid Retrieval、Agent Workflow、Observability、Evaluation、Multimodal Provider。
- 简历项目的最后阶段更需要“可运行、可讲清、可验证”，而不是继续堆功能。

## 取舍

- 一键 demo seed 使用现有 Service，不直接访问 Prisma。
- Provider smoke 使用 readiness 和安全配置摘要，不发昂贵推理请求。
- README 采用 Mermaid 架构图，避免维护独立图片资产。

## 后果

- 项目可以作为服务器部署演示版本。
- 后续如果继续迭代，应优先做前端视觉 polish 或更真实的 provider adapter，而不是改动核心架构。
