# TASK-028：架构决策记录

## 背景

企业 RAG 系统中，`DocumentContent.content` 是后续 Chunk、Embedding、Retrieval、Graph、Agent 的事实来源。只保存正文不足以支持生产级闭环，因为系统需要知道内容从哪里来、是否发生变化、属于哪个 Space、使用了什么 Parser 和 Cleaner、语言是什么、默认密级是什么。

TASK-028 选择在 `DocumentContent` 上新增 JSON metadata，并在 Chunk 生成时向下传播核心字段。

## 决策 1：metadata 存在 DocumentContent，而不是 Document

决定：

```text
DocumentContent.metadata
```

原因：

- metadata 描述的是“已解析、已清洗后的内容版本”，不是 Document 聚合的所有业务属性。
- `contentHash`、`lineCount`、`parser`、`cleaner` 都与内容处理结果绑定。
- 后续如果 Document 重新处理，metadata 可以跟随内容一起 upsert。

后果：

- 查询文档列表时不会默认加载较大的 content/metadata。
- 获取 metadata 需要通过内容记录读取。

## 决策 2：第一版使用 JSON，而不是拆成多列

决定：

```prisma
metadata Json @default("{}")
```

原因：

- metadata 字段会继续演进，TASK-029、OCR、ASR、PDF layout 都可能扩展字段。
- 第一版不需要对 `contentHash`、`language`、`securityLevel` 做复杂索引。
- 可以避免过早设计大量列和 migration。

后果：

- 强查询和索引能力暂不作为本任务目标。
- 如果后续需要按 metadata 高频过滤，可以再迁移出部分列或增加 JSONB 索引。

## 决策 3：securityLevel 默认 INTERNAL

决定：

```text
securityLevel = INTERNAL
```

原因：

- 企业知识默认不应被当作公开数据。
- 第一版没有密级策略引擎，使用保守默认值更安全。
- 后续可以由 Document Metadata 任务、前端文档工作台或策略引擎更新。

后果：

- 本任务只负责默认值和传播，不做强权限过滤。
- Retrieval 权限仍以 Space 权限为主。

## 决策 4：language 使用启发式检测

决定：

不调用 LLM，仅统计中文字符和拉丁字母。

原因：

- 文档处理链路不应依赖额外模型服务。
- 语言字段主要用于 Evaluation、UI、后续 splitter/provider 策略选择，轻量判断足够。
- 可重复、低成本、无外部失败点。

后果：

- 混合语种检测比较粗糙。
- 后续可替换为更精细的 LanguageDetector，但不影响接口。

## 决策 5：Chunk metadata 只传播核心字段

决定：

传播：

- `spaceId`
- `documentType`
- `language`
- `securityLevel`
- `sourceHash`
- `contentHash`

不传播：

- `mimeType`
- `size`
- `storageKey`
- `parser`
- `cleaner`
- `processedAt`

原因：

- Chunk metadata 用于检索、过滤、引用和 Evaluation，应保持轻量。
- `storageKey` 不应该在检索结果中过度扩散。
- Parser/Cleaner 详情属于文档级处理历史，不是每个 Chunk 的必要字段。

后果：

- Citation 仍能通过 `documentId` 查询完整文档 metadata。
- Retrieval 返回的 metadata 更稳定、更小。

## 决策 6：Metadata API 只返回 metadata，不返回正文

决定：

```text
GET /documents/:id/metadata
```

返回：

```ts
{
  documentId: string;
  metadata: DocumentContentMetadata;
}
```

原因：

- 文档工作台、Evaluation、调试面板常常只需要 metadata。
- 避免把正文通过 metadata API 泄露。
- 符合最小暴露原则。

后果：

- 如需查看正文，应新增受控的内容 API，而不是复用 metadata API。

## 边界

本任务不处理：

- Pipeline Event / Job。
- OCR / ASR / page number。
- 文档密级策略引擎。
- Retrieval 排序策略。
- Agent Prompt。
- 多租户模型。
- Elasticsearch / PGVector。
