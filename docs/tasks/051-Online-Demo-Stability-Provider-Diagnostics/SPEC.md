# TASK-051：Online Demo Stability & Provider Diagnostics

## 目标

让线上演示环境在模型服务、向量服务、重排序服务或图谱服务异常时可解释、可定位、不中断用户理解。

本任务聚焦演示稳定性，不新增大模型能力，不改变 RAG/Agent 编排。

## 必须实现

- provider smoke 从“配置检查”升级为“真实轻量探测”。
- `/health/readiness` 能区分配置完整、服务可连接、推理/向量/rerank 可用。
- 后端统一错误码：
  - `LLM_UNAVAILABLE`
  - `EMBEDDING_UNAVAILABLE`
  - `RERANKER_UNAVAILABLE`
  - `GRAPH_UNAVAILABLE`
  - `UNSUPPORTED_FILE_TYPE`
- 前端展示中文业务错误。
- provider smoke 报告不输出 API key、prompt、answer、document content、file buffer。

## 不做

- 不新增搜索 API。
- 不新增部署脚本。
- 不做 GraphRAG 推理路径。
- 不引入外部 APM。
- 不记录完整 prompt/answer/document content。
- 不改变 provider SDK 边界。

## Readiness 类型

`ReadinessCheck` 增加演示诊断字段：

```ts
stage?: 'configuration' | 'connectivity' | 'inference';
code?: string;
configured?: boolean;
reachable?: boolean;
inference?: boolean;
```

## 验收标准

- 关闭模型服务时，readiness 展示对应 provider failed 和中文原因。
- LLM/Embedding/Reranker 正常时，provider smoke 能验证真实调用。
- Embedding 维度不匹配时显示“向量模型维度不匹配”。
- 上传不支持文件类型时显示“文件格式暂不支持”。
- Graph 服务异常时显示“图谱服务未连接”。
- 前端 Observability 面板展示 provider stage/code/message。
