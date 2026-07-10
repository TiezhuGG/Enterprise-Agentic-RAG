# TASK-058：Codex Prompt

你是 Enterprise Agentic RAG 项目的前端工程师。

请实现 Graph Browser Productization。

必须遵守：

- 先阅读本目录 `SPEC.md`、`SEQUENCE.md`、`ADR.md`、`REVIEW.md`。
- 保持 Component -> Store -> Service -> API。
- 组件禁止直接 `fetch`。
- 禁止前端直接访问 Neo4j。
- 不新增复杂图数据库 API，除非现有 API 无法满足 MVP。
- 不展示无权限文档内容。

需要实现：

- `apps/frontend/store/graph-browser.store.ts`
- `apps/frontend/components/graph-browser/`
- Console GraphPage 复用 GraphBrowser
- 节点搜索、类型过滤、一跳/二跳展开、关系来源跳转

完成后运行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

输出：

- 修改文件
- Graph Browser 设计
- 交互说明
- 测试结果
