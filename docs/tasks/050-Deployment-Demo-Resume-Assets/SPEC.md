# TASK-050：Deployment Demo Polish + Resume Assets

## 目标

把 Enterprise Agentic RAG 整理成可部署、可演示、可写进简历的 MVP 版本。

## 必须完成

- 一键 demo seed / sample dataset。
- provider smoke report。
- README 架构图、启动方式、演示脚本。
- 简历项目描述：准确说明已实现能力与未实现限制。
- 录屏或截图素材清单。
- 部署检查清单。

## 禁止

- 不新增大功能。
- 不重构 Agent / Retrieval / Ingestion 主链路。
- 不在报告、README、日志中暴露 API key、完整 prompt、answer、document content。
- 不把截图或录屏二进制提交到仓库。

## 验收标准

- `pnpm demo:seed` 可以准备 demo 数据并输出关键 ID。
- `pnpm provider:smoke` 可以生成安全报告。
- README 无乱码，能指导本地和生产部署。
- demo 文档能按步骤完成 `Login -> Space -> Upload/Ingest -> Agent Debug -> Assistant`。
- 简历描述客观，不夸大成商业化产品。
