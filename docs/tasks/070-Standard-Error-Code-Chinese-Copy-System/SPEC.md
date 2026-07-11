# TASK-070：Standard Error Code & Chinese Copy System

## 目标

建立统一的错误码与中文文案体系，让后端 API、SSE、前端 Workbench、搜索、运维面板在失败时返回一致、安全、可理解的错误信息。

本任务是 MVP 收口任务，不新增业务能力，不新增数据库表，重点解决：

- 后端错误响应格式统一。
- Provider、上传、检索、权限、认证等高频错误码有稳定 code。
- 前端统一根据 code 映射中文文案。
- 错误信息不泄露 API key、JWT、prompt、answer、document content、二进制内容。
- smoke 能验证关键错误码和文案映射。

## 目录结构

后端新增或调整：

```text
apps/backend/src/common/errors/
├── app-error-codes.ts
├── app-exception.filter.ts
├── run-error-smoke.ts
└── index.ts
```

前端新增或调整：

```text
apps/frontend/lib/
├── error-copy.ts
└── workbench-copy.ts
```

脚本：

```text
package.json
apps/backend/package.json
```

## 标准错误响应

HTTP API 标准错误响应：

```ts
interface StandardErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  requestId?: string;
}
```

保留兼容：

- `code`
- `message`

现有 `getAppErrorResponse()` 仍可读取旧格式和新格式。

## 错误码范围

第一版覆盖 MVP 演示所需错误：

```text
BAD_REQUEST
VALIDATION_ERROR
AUTH_REQUIRED
INVALID_CREDENTIALS
FORBIDDEN
NOT_FOUND
CONFLICT
INTERNAL_ERROR
DATABASE_UNAVAILABLE
REDIS_UNAVAILABLE
STORAGE_UNAVAILABLE
VECTOR_UNAVAILABLE
SEARCH_UNAVAILABLE
GRAPH_UNAVAILABLE
LLM_UNAVAILABLE
EMBEDDING_UNAVAILABLE
RERANKER_UNAVAILABLE
OCR_UNAVAILABLE
ASR_UNAVAILABLE
VIDEO_UNAVAILABLE
UNSUPPORTED_FILE_TYPE
INGESTION_FAILED
DOCUMENT_NOT_FOUND
SPACE_NOT_FOUND
CONVERSATION_NOT_FOUND
EXECUTION_NOT_FOUND
PIPELINE_NOT_FOUND
```

## 前端中文文案

前端只展示安全中文文案：

- 大模型服务不可用
- 向量模型不可用
- 重排序服务不可用
- 图谱服务未连接
- 文件格式暂不支持
- 登录已失效，请重新登录
- 没有权限执行此操作
- 请求的资源不存在
- 系统暂时不可用，请稍后重试

前端不得展示：

- API key
- Bearer token
- 完整 prompt
- 完整 answer
- 完整 DocumentContent
- Provider 原始长错误正文

## 架构规则

必须保持：

```text
Component
↓
Store
↓
Service
↓
API
```

禁止：

- React 组件直接 `fetch`。
- Controller 中拼接业务错误文案。
- 前端各 store 自己维护一份错误码映射。
- 错误响应包含 secret、prompt、answer、document content。

## 验收标准

- 后端错误码目录完整，且每个 code 都有中文 message。
- 未捕获 HTTP 异常也被统一为标准错误响应。
- 前端 API client 能读取标准错误响应并生成中文错误。
- Workbench、Agent Debug、Chat、Search、Observability、Ops 的错误 fallback 使用统一中文文案。
- `pnpm error:smoke` 通过。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 通过。
