# TASK-057：Sequence

## 回答完成流程

```text
Agent 返回 answer + citations + verification
↓
Chat / Agent Debug store 保存 citations
↓
AnswerTrust 计算可信度
↓
UI 展示可信度、引用数量、最高相关度和说明
```

## 无依据流程

```text
Retrieval 无结果
↓
Prompt 要求模型不得编造
↓
AnswerTrust 判断 citations.length = 0
↓
UI 显示“没有找到依据”
```

## 引用定位流程

```text
用户点击 Citation
↓
AnswerTrustStore.openCitation()
↓
读取 documentService.get(documentId)
↓
如果可预览，调用 documentService.preview(document)
↓
文本类文档尝试匹配 citation.content
↓
Preview Dialog 展示高亮片段和来源信息
```

## 错误流程

```text
文档不存在或无权限
↓
documentService 抛出错误
↓
AnswerTrustStore 转换为短错误
↓
Preview Dialog 显示安全错误
```

错误中不得展示 token、API key、prompt、完整文档正文。

## 历史消息流程

```text
GET /conversations/:id/messages
↓
读取 assistant message.metadata.citations
↓
恢复到 ChatMessage.citations
↓
MessageBubble 展示引用来源
```
