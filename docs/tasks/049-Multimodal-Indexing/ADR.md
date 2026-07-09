# TASK-049：架构决策

## 决策

多模态索引通过 Document Processing parser 接入，而不是让 MultimodalAttachment 自动入库。

## 原因

- Knowledge Document 是知识库索引的入口。
- Chat 附件通常是一次性上下文，不能默认污染企业知识库。
- 复用 DocumentContent -> Chunk -> Embedding -> Retrieval 可以保持权限、元数据和 citation 一致。

## 后果

- 用户需要显式把图片、音频、视频上传为 Space Document 才会进入长期检索。
- 后续如果需要“附件转知识库文档”，应新增显式 promote API。
