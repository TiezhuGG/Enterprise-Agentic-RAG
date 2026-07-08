# RAG Evaluation

本目录保存离线 RAG 评估数据集和报告。

默认数据集：

```text
docs/evaluation/dataset.example.json
```

运行方式：

```bash
pnpm --filter @enterprise-agentic-rag/backend evaluation:run
```

指定数据集和输出目录：

```bash
pnpm --filter @enterprise-agentic-rag/backend evaluation:run -- ../../docs/evaluation/dataset.example.json ../../docs/evaluation/reports
```

第一版评估指标：

- `retrievalRecall`
- `citationCoverage`
- `answerExpectedTermCoverage`
- `answerGroundedness`

没有 `conversationId` 的 case 只执行检索评估；提供 `conversationId` 后会调用 Agent API 内部服务执行回答评估。
