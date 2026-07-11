# TASK-070 流程说明

## HTTP 错误流程

```text
Service / Provider / Guard
↓
throw AppError 或 Nest HttpException
↓
AppExceptionFilter
↓
标准错误响应
↓
Frontend api-client
↓
error-copy 中文文案
↓
Store error state
↓
UI 展示短中文错误
```

## AppError 流程

```text
createAppBadRequestException(code)
或
createAppServiceUnavailableException(code)
↓
response.body = { code, message }
↓
AppExceptionFilter 保留 code/message
↓
补充 statusCode/timestamp/path/requestId
```

## 普通 Nest 异常流程

```text
throw new NotFoundException('Document not found')
↓
AppExceptionFilter 根据 status/message 推断 code
↓
DOCUMENT_NOT_FOUND / NOT_FOUND
↓
返回统一中文 message
```

## Validation 错误流程

```text
class-validator / ValidationPipe
↓
BadRequestException(message[])
↓
AppExceptionFilter
↓
VALIDATION_ERROR
↓
前端显示：请求参数不正确，请检查输入
```

## Provider 错误流程

```text
OpenAI-compatible Provider
↓
HTTP / parse / unavailable
↓
createAppServiceUnavailableException(PROVIDER_UNAVAILABLE)
↓
Readiness / Agent / Ingestion 记录 safe message
↓
前端展示中文 provider 错误
```

## SSE 错误流程

```text
AgentService.executeStream()
↓
catch(error)
↓
toAppErrorMessage(error, fallback)
↓
SSE error event: { type: 'error', data: { message } }
↓
前端 Agent/Chat store 进入统一错误文案处理
```

## 安全清洗流程

```text
raw error message
↓
redact token / api key / password
↓
compress whitespace
↓
truncate
↓
返回短错误
```

## Smoke 流程

```text
pnpm error:smoke
↓
验证每个错误码有中文文案
↓
验证 AppError 可被读取
↓
验证普通 HttpException 可标准化
↓
验证 secret 被脱敏
↓
输出安全 smoke summary
```
