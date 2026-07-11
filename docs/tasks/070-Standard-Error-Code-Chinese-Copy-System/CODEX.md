# TASK-070 Codex Prompt

你是 Enterprise Agentic RAG 项目的后端与前端架构工程师。

请实现 TASK-070：Standard Error Code & Chinese Copy System。

必须先阅读本目录下：

```text
SPEC.md
SEQUENCE.md
ADR.md
REVIEW.md
CODEX.md
```

## 目标

统一后端错误码、标准 HTTP 错误响应和前端中文错误文案，让线上演示时用户能看到清晰、安全、中文的失败原因。

## 必须实现

后端：

- 扩展 `apps/backend/src/common/errors/app-error-codes.ts`。
- 新增 `apps/backend/src/common/errors/app-exception.filter.ts`。
- 在 `apps/backend/src/main.ts` 注册全局异常过滤器。
- 新增 `apps/backend/src/common/errors/run-error-smoke.ts`。
- 增加 `pnpm error:smoke` 脚本。

前端：

- 新增 `apps/frontend/lib/error-copy.ts`。
- 修复 `apps/frontend/lib/workbench-copy.ts` 的中文文案。
- `apps/frontend/services/api-client.ts` 使用统一错误文案。
- 主要 store 的 fallback 错误提示改为中文。

## 禁止

- 不新增数据库表。
- 不新增业务 API。
- 不让 Controller 访问 Repository/Prisma/Redis/Neo4j。
- 不让 React 组件直接 fetch。
- 不输出 API key、JWT、password、prompt、answer、document content。
- 不引入大型 i18n 框架。

## 验证

执行：

```bash
pnpm error:smoke
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

额外检查：

```bash
rg "fetch\(" apps/frontend/components apps/frontend/app apps/frontend/store
```

## 输出

完成后输出：

- 修改文件列表
- 错误码设计
- 前端中文文案设计
- smoke / validation 结果
- 自行 review 结论
