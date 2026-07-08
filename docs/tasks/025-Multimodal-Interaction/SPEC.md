# TASK-025 Multimodal Interaction

## 目标

为 Enterprise Agentic RAG 增加第一版多模态交互入口。

本任务只支持用户在 Assistant UI 中附加图片和音频，并让后端将附件转为可供 Agent 使用的文本上下文。

核心链路：

```text
Frontend attachment
-> Multimodal Upload API
-> StorageService
-> MultimodalProvider
-> extracted text
-> Agent request attachmentIds
-> MultimodalService context
-> Agent Prompt
```

## 范围

新增后端模块：

```text
apps/backend/src/modules/multimodal/
├── dto/
├── providers/
├── multimodal.controller.ts
├── multimodal.module.ts
├── multimodal.repository.ts
├── multimodal.service.ts
├── multimodal.types.ts
└── index.ts
```

新增前端能力：

```text
apps/frontend/services/multimodal.service.ts
apps/frontend/types/multimodal.ts
components/chat/ChatInput 附件选择
store/chat.store.ts 保存附件状态
```

## 支持类型

第一版支持：

- IMAGE
- AUDIO

不支持：

- VIDEO
- PDF
- Office
- Parser Pipeline
- Chunk
- Embedding
- Vector Search

## 后端 API

```text
POST /multimodal/attachments
multipart/form-data
fields:
  file
  conversationId?
```

返回：

```ts
interface MultimodalAttachmentResponse {
  id: string;
  type: 'IMAGE' | 'AUDIO';
  status: 'EXTRACTED' | 'FAILED';
  filename: string;
  mimeType: string;
  size: number;
  extractedText: string;
  createdAt: string;
}
```

Agent API 扩展：

```ts
interface AgentChatRequestDto {
  attachmentIds?: string[];
}
```

## 数据库

新增：

```text
MultimodalAttachment
```

字段：

- id
- userId
- conversationId?
- type
- status
- filename
- mimeType
- size
- storageKey
- extractedText
- createdAt
- updatedAt

## Provider

定义接口：

```ts
interface MultimodalProvider {
  extract(input: MultimodalExtractionInput): Promise<MultimodalExtractionResult>;
}
```

第一版实现：

- `MetadataMultimodalProvider`

该 Provider 不调用外部 OCR/ASR 服务，只生成稳定的元数据文本，保证架构链路可用。

后续 OCR/ASR/Video Understanding 通过 Provider 替换。

## 禁止

- 不让 Agent 直接处理文件或二进制。
- 不把图片、音频 buffer 放进 LLM prompt。
- 不让 Controller 调用 StorageService、Repository 或 Provider。
- 不让 Service 直接访问 Prisma。
- 不接 Chunk、Embedding、Vector Search。
- 不实现 Video Understanding。
- 不写死 MinIO 或模型配置。

## 配置

新增：

```text
MULTIMODAL_MAX_FILE_SIZE_MB
MULTIMODAL_ALLOWED_MIME_TYPES
```

必须通过已有 ConfigService 获取。

## 验收标准

- 图片附件可上传。
- 音频附件可上传。
- 附件写入 MinIO。
- 附件元数据和 extractedText 写入数据库。
- Agent request 可携带 attachmentIds。
- Prompt 中出现 Multimodal Context。
- 前端可选择附件并显示上传状态。
- 页面不直接 fetch，组件不包含 API 逻辑。
- 通过 format、lint、typecheck、build。
