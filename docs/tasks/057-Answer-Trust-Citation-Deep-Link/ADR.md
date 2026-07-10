# TASK-057：ADR

## 决策

前端新增统一 Answer Trust 组件和 Store，而不是继续在 Chat、Agent Debug、Console 中各自实现 citation UI。

## 原因

- 引用可信度是跨页面能力。
- 未来 Search、Chat、Agent Debug、GraphRAG 都需要复用同一套 citation 卡片。
- Store 负责读取文档预览，避免组件直接调用 API。

## 可信度计算

第一版使用启发式：

- `none`：没有 citations。
- `low`：有 citation 但 verification 未通过，或 citation 分数很低。
- `medium`：有 citation 且至少一个来源可用。
- `high`：verification 通过，并且有多个 citation 或多个文档来源。

该策略不作为模型评估分数，只作为演示和产品提示。

## 引用定位

第一版不做 PDF 页码级定位，不新增 OCR layout。

定位策略：

- TXT / Markdown：读取原文件文本，尝试高亮 citation.content 的前若干字符。
- PDF / IMAGE：展示原文件预览，并在右侧展示 citation 片段。
- Graph citation：不打开原文件，只展示图谱来源片段和 metadata。

## 后果

- TASK-058 可继续做 Graph Browser。
- TASK-060 可在 citation 中标记 vector / keyword / graph path。
- 后续如果增加 DocumentContent 只读片段 API，可以替换当前原文件定位逻辑。
