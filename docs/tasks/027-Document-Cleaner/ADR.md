# TASK-027 ADR

## 决策 1：Cleaner 放在 document-processing 内部

### 背景

当前 Parser 属于 `document-processing` 模块，`DocumentContent` 也是由该模块写入。清洗发生在 Parser 输出和 `DocumentContent` 写入之间。

### 决策

在现有模块中新增：

```text
apps/backend/src/modules/document-processing/cleaners/
```

不新增独立业务模块。

### 后果

好处：

- 依赖边界简单。
- Parser 仍只负责解析格式。
- Cleaner 专注规范化 Markdown 内容。

代价：

- Cleaner 暂时不是跨模块能力。

## 决策 2：不修改数据库

### 背景

后续 TASK-028 会处理 Document Metadata。当前任务只需要让 `DocumentContent.content` 更干净。

### 决策

TASK-027 不新增表、不新增字段。

清洗 metadata 只进入日志，不持久化。

### 后果

好处：

- 无 migration 风险。
- 对现有 Chunk / Embedding / Retrieval 无破坏。

代价：

- 无法事后查询每次清洗的 metadata。

## 决策 3：保守清洗，不破坏 Markdown 结构

### 背景

后续 Chunk 依赖 Markdown heading，Citation 依赖内容可读性。如果清洗过度，会影响分块和引用。

### 决策

仅做保守规范化：

- 换行统一。
- 控制字符移除。
- 行尾空白处理。
- 空行压缩。
- 标题兜底。

不做语义重写。

### 后果

好处：

- 对 Parser 输出影响可控。
- 不破坏表格、列表和代码块。

代价：

- 不能解决复杂版面还原问题。

## 决策 4：标题兜底使用 Document.title

### 背景

TXT / PDF 解析结果经常没有 Markdown heading。没有 heading 时，Chunk metadata 的 sectionTitle 通常会退回默认标题。

### 决策

如果内容中没有一级或二级标题，则添加：

```text
# {document.title}
```

### 后果

好处：

- 改善 Markdown Header Split。
- 改善 citation sectionTitle。
- 对无标题纯文本更友好。

代价：

- 原始文档内容会多一行系统生成标题。

## 决策 5：清洗后空内容必须失败

### 背景

空内容如果进入 Chunk / Embedding，会产生误导性成功状态。

### 决策

清洗后内容为空时抛出异常，由 `DocumentProcessingService` 标记 Document 为 `FAILED`。

### 后果

好处：

- READY 状态更可信。
- 避免后续 pipeline 处理无效内容。

代价：

- 某些空白文档无法进入知识库，需要用户重新上传有效文件。
