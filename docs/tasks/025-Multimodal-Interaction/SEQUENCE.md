# TASK-025 Sequence

## 上传附件正常流程

```text
用户选择图片或音频
↓
ChatInput 调用 store
↓
store 调用 multimodal.service
↓
POST /multimodal/attachments
↓
Controller 接收 multipart
↓
MultimodalService 校验文件
↓
StorageService 上传 object
↓
MultimodalProvider 生成 extractedText
↓
Repository 保存 MultimodalAttachment
↓
返回 attachment id 和上传状态
```

## 发送多模态问题流程

```text
用户输入问题并带 attachmentIds
↓
POST /agent/chat/stream
↓
AgentService 调用 MultimodalService.buildContext()
↓
MultimodalService 校验附件归属当前用户和当前 conversation
↓
返回 MultimodalContext[]
↓
AgentState 保存 multimodalContext
↓
AnswerNode 交给 PromptBuilder
↓
PromptBuilder 写入 Multimodal Context
↓
LLM 返回答案
```

## 错误流程：类型不支持

```text
上传附件
↓
MultimodalService 校验 mimeType
↓
不在允许列表
↓
返回 400
↓
前端显示附件失败
```

## 错误流程：文件过大

```text
上传附件
↓
FileInterceptor 限制文件大小
↓
超限
↓
请求失败
↓
前端保留错误状态
```

## 错误流程：Provider 失败

```text
Storage 上传成功
↓
Provider extract 失败
↓
Repository 保存 FAILED 状态
↓
返回错误
↓
Agent 不使用该附件
```

## 安全流程

```text
Agent request 携带 attachmentIds
↓
MultimodalService 查询附件
↓
校验 userId
↓
校验 conversationId 为空或等于当前会话
↓
只返回合法附件上下文
```

## 后续升级流程

```text
MetadataMultimodalProvider
↓
替换为 OCR Provider 或 ASR Provider
↓
仍然输出 extractedText
↓
Agent 和 UI 无需理解具体模型 SDK
```
