# TASK-049：Codex Prompt

请把 IMAGE/AUDIO/VIDEO 文档接入现有 ingestion pipeline。必须通过 DocumentProcessing parser 和 provider 输出文本，再进入 DocumentContent、Chunk、Embedding、Retrieval。不要让 Agent 或 Retrieval 处理二进制。
