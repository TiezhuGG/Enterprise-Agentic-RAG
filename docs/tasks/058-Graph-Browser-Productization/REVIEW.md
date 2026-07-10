# TASK-058：Review Checklist

## 实现前

- [x] 阅读 KnowledgeGraphController。
- [x] 阅读 graph.service.ts。
- [x] 阅读 types/graph.ts。
- [x] 阅读现有 Console GraphPage。
- [x] 阅读 workbench.store.ts。

## 实现后

- [x] 新增 5 个任务文档。
- [x] 新增 graph-browser store。
- [x] 新增 graph-browser 组件。
- [x] Console GraphPage 复用 GraphBrowser。
- [x] 支持 Space / Document scope。
- [x] 支持节点搜索。
- [x] 支持节点类型过滤。
- [x] 支持一跳 / 二跳展开。
- [x] 支持关系来源文档跳转。
- [x] 组件不直接 `fetch`。

## 验证

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`

## Smoke

- [ ] 选择 Space 后加载图谱。
- [ ] 输入节点关键词并查询。
- [ ] 切换节点类型过滤。
- [ ] 点击节点展开一跳。
- [ ] 切换二跳。
- [ ] 点击关系查看来源文档。
- [ ] 点击来源文档后选中文档。
