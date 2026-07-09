# TASK-046：Codex Prompt

你是 Enterprise Agentic RAG 项目的后端工程师。

请实现 OCR Provider，但必须遵守现有 DDD 边界：

- Controller 不调用 Provider。
- Agent 不处理图片二进制。
- 文件继续落 MinIO。
- OCR 输出 Markdown 文本和安全 metadata。
- 默认 metadata fallback，不要求本地必须有真实 OCR 服务。

实现后运行格式、lint、typecheck、build 和 Prisma 校验；涉及 schema 变更时执行 migrate/seed。
