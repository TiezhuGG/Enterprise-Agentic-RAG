# TASK-025 Codex Prompt

你是 Enterprise Agentic RAG 项目的后端与前端工程师。

请严格遵守当前 DDD 架构，实现 Multimodal Interaction 第一版。

## 必须先阅读

```text
docs/tasks/025-Multimodal-Interaction/SPEC.md
docs/tasks/025-Multimodal-Interaction/SEQUENCE.md
docs/tasks/025-Multimodal-Interaction/ADR.md
docs/tasks/025-Multimodal-Interaction/REVIEW.md
docs/tasks/025-Multimodal-Interaction/CODEX.md
```

## 目标

支持用户在 Assistant UI 中附加图片和音频，并让 Agent 使用附件抽取出的文本上下文回答问题。

## 必须实现

后端：

```text
apps/backend/src/modules/multimodal/
```

包含：

- controller
- service
- repository
- module
- dto
- providers
- types
- index

前端：

- `services/multimodal.service.ts`
- `types/multimodal.ts`
- ChatInput 附件选择
- chat.store 附件状态与上传流程

数据库：

- `MultimodalAttachment`
- migration

## API

```text
POST /multimodal/attachments
```

multipart 字段：

- `file`
- `conversationId?`

Agent API 增加：

```ts
attachmentIds?: string[]
```

## 禁止

- 不实现 Video Understanding。
- 不实现 Chunk、Embedding、Vector Search。
- 不让 Agent 直接读取文件或处理 buffer。
- 不把二进制塞入 prompt。
- 不让 Controller 调用 Repository、StorageService 或 Provider。
- 不让 Service 直接访问 Prisma。
- 不让前端页面或组件直接 fetch。

## Provider

第一版实现 Metadata Provider。

它只生成文件元数据文本，不伪造图片识别或语音识别结果。

未来 OCR/ASR Provider 必须复用同一接口。

## 验证

执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

## 输出

完成后输出：

- 修改文件列表
- 新增目录
- 多模态链路
- API 说明
- 前端交互说明
- 测试结果
- 后续 OCR/ASR 接入方式
