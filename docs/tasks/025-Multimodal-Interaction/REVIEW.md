# TASK-025 Review Checklist

## 实现前

- [x] 已确认 Agent API 使用 JSON 和 SSE。
- [x] 已确认 StorageService 已封装 MinIO。
- [x] 已确认前端架构为 Component -> Store -> Service -> API。
- [x] 已确认 AgentService 可以在创建 AgentState 前准备额外上下文。

## 实现中

- [x] 新增 TASK-025 五个中文文档。
- [x] 新增 Prisma 模型和 migration。
- [x] 新增 multimodal module。
- [x] 新增 provider interface。
- [x] 新增 metadata provider。
- [x] 新增 upload attachment API。
- [x] Agent request 支持 attachmentIds。
- [x] AgentState 支持 multimodalContext。
- [x] PromptBuilder 支持 Multimodal Context。
- [x] 前端新增 multimodal service/type。
- [x] ChatInput 支持附件选择。
- [x] Chat store 维护附件状态。
- [x] README 更新。

## 架构检查

- [x] Controller 不访问 Repository。
- [x] Controller 不访问 StorageService。
- [x] Controller 不访问 Provider。
- [x] Service 不直接访问 Prisma。
- [x] Agent 不处理文件 buffer。
- [x] Prompt 不包含二进制。
- [x] 配置通过 ConfigService。
- [x] 前端组件不直接 fetch。

## 验证后

- [x] `pnpm format:check` 通过。
- [x] `pnpm lint` 通过。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。

## 风险

- 第一版只是元数据抽取，不代表真实 OCR/ASR。
- multipart 上传失败时需要 UI 展示清楚。
- 后续真实 Provider 可能需要异步任务队列。
