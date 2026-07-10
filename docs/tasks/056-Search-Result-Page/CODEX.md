# TASK-056：Codex Prompt

你是 Enterprise Agentic RAG 项目的前端工程师。

请实现 Search Result Page。

必须遵守：

- 先阅读本目录下 `SPEC.md`、`SEQUENCE.md`、`ADR.md`、`REVIEW.md`。
- 保持 Component -> Store -> Service -> API。
- React 组件禁止直接 `fetch`。
- 搜索页禁止调用 Agent API。
- 不新增后端 API。
- 不展示完整 DocumentContent、prompt、answer、token、API key。

需要实现：

- `apps/frontend/types/search.ts`
- `apps/frontend/services/search.service.ts`
- `apps/frontend/store/search.store.ts`
- `apps/frontend/components/search/`
- Demo Workbench Search tab。
- Console SearchPage 复用 Search Center。

完成后运行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

输出：

- 修改文件
- 新组件
- API 说明
- 测试结果
