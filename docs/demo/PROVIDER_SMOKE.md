# Provider Smoke Guide

本文档用于确认 MVP Demo 所需基础设施和模型服务已接通。

## 命令

```bash
pnpm provider:smoke
```

默认会在下面目录生成 JSON 和 Markdown 报告：

```text
docs/demo/reports/
```

报告包含：

- App 环境与端口。
- LLM / Embedding / Reranker 配置摘要。
- OCR / ASR / Video provider 模式。
- `/health/readiness` 的检查结果。
- 每个依赖的 status、duration、message。

报告不会包含：

- API key。
- password。
- prompt。
- answer。
- document content。
- file buffer。

## 必需服务

基础设施：

- PostgreSQL + pgvector
- Redis
- MinIO
- Neo4j
- Elasticsearch

模型服务：

- OpenAI-compatible LLM
- OpenAI-compatible Embedding
- OpenAI-compatible Reranker

可选多模态服务：

- OCR provider
- ASR provider
- Video understanding provider

OCR / ASR / Video 可以保持 `metadata` fallback，用于无真实多模态推理服务的 demo。

## Readiness 判断

`ok`：

- 核心基础设施可连接。
- 模型 provider 配置完整。
- 多模态 provider 处于 metadata fallback 或配置完整。

`degraded`：

- 某个基础设施不可连接。
- 某个必需 provider 配置不完整。
- Neo4j / Elasticsearch / MinIO / Redis 未启动。

## 推荐部署前检查

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm db:validate
pnpm db:deploy
pnpm provider:smoke
```

## 示例报告字段

```json
{
  "status": "ok",
  "jsonPath": ".../provider-smoke-2026-07-09T00-00-00-000Z.json",
  "markdownPath": ".../provider-smoke-2026-07-09T00-00-00-000Z.md"
}
```

## 失败定位

Embedding 失败：

- 检查 `EMBEDDING_API_URL` 是否为 embeddings endpoint。
- 检查 `EMBEDDING_DIMENSION` 是否与模型输出一致。
- 检查 provider 是否兼容 OpenAI embeddings response。

Reranker 失败：

- 检查 rerank endpoint 是否存在。
- 如果本地没有 reranker，可以先提供兼容 mock 或使用稳定服务。

Graph degraded：

- 确认 Neo4j HTTP/Bolt 配置与代码使用方式一致。
- 演示时可以先关闭 graph extraction。

Search degraded：

- 确认 Elasticsearch 容器启动。
- 执行 `pnpm search:reindex` 重建 chunk index。
