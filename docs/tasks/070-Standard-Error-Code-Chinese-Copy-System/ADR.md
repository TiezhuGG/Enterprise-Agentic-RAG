# TASK-070 ADR

## 决策 1：后端保留轻量错误码目录，不引入大型 i18n 框架

原因：

- 当前 MVP 只需要中文演示文案。
- 错误码数量可控。
- 引入 i18n 框架会增加配置和运行复杂度。

后果：

- 未来需要多语言时，可以把 catalog 抽到 message provider。
- 当前 code/message 已经稳定，前端可以安全依赖。

## 决策 2：全局异常过滤器只做标准化，不吞掉业务语义

原因：

- 已有模块中存在 `NotFoundException`、`ForbiddenException`、`BadRequestException`。
- 一次性替换所有 throw 风险高。

做法：

- 如果异常已有合法 `code`，保留。
- 如果没有 code，根据 HTTP status 和 message 轻量推断。
- 未知异常统一为 `INTERNAL_ERROR`。

## 决策 3：前端中文文案以 code 优先，message 兜底

原因：

- code 稳定，message 可调整。
- Provider 原始 message 可能包含实现细节，不应直接暴露给用户。

做法：

- `error-copy.ts` 维护唯一前端错误码文案表。
- `api-client.ts` 读取后端 code 后输出安全 message。
- `workbench-copy.ts` 继续负责业务状态文案，但错误文案委托给 `error-copy.ts`。

## 决策 4：不记录完整敏感正文

原因：

- 项目包含企业知识库、Agent prompt、模型回答、文件内容。
- 错误链路经常进入日志、Timeline、前端面板。

做法：

- 错误响应不包含 prompt、answer、document content。
- 脱敏 Bearer token、API key、password。
- 对未知错误做长度截断。

## 决策 5：TASK-070 不新增数据库

原因：

- 错误码和中文文案是代码级稳定契约。
- 持久化错误事件已经由 Observability/Execution/Pipeline 承担。

后果：

- 不需要 migration。
- smoke 可用纯函数和轻量脚本验证。
