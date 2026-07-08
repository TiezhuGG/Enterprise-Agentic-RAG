# TASK-025 ADR

## 决策：先做图片和音频

图片和音频是多模态交互的最小闭环。

视频理解、OCR 版式还原、ASR 分段、时间轴索引都需要更重的 Pipeline，本任务不一次性展开。

## 决策：附件先转文本，再进入 Agent

Agent 不直接处理文件，也不把二进制放进 prompt。

后端通过 MultimodalService 把附件转换为文本上下文：

```text
attachment file -> object storage -> extracted text -> MultimodalContext
```

这样 Agent Workflow 只消费上下文，不关心附件存储、文件格式和抽取实现。

## 决策：新增 MultimodalAttachment 数据表

附件需要跨请求被 Agent 引用，所以不能只依赖前端状态。

数据库保存：

- 用户归属
- 会话归属
- 存储 key
- 抽取状态
- extractedText

这样可以支持权限校验、审计和后续异步 OCR/ASR。

## 决策：第一版 Provider 使用 Metadata 实现

当前项目尚未引入 OCR/ASR 模型服务。为了先建立边界和链路，第一版 Provider 只生成元数据文本。

它不会假装识别图片内容或音频内容，只描述文件名、类型、大小和 MIME。

后续替换为真实 OCR/ASR Provider 时，只需要实现相同接口。

## 决策：前端先上传附件，再发送 Agent 请求

两段式流程比在 `/agent/chat/stream` 中混合 multipart 和 SSE 更清晰：

- 上传附件使用普通 multipart。
- Streaming 回答继续使用 SSE JSON。
- 失败状态更容易在 UI 呈现。

## 后果

收益：

- Agent 边界保持纯上下文输入。
- Controller 不包含业务逻辑。
- Provider 可替换。
- 后续可接异步多模态 Pipeline。

代价：

- 第一版 extractedText 不是真实 OCR/ASR 结果。
- 前端需要先完成附件上传再开始流式回答。
- 需要新增数据库表和 migration。
