# TASK-052：Review Checklist

## 实现前

- [ ] 确认现有 `demo:seed` 参数和输出。
- [ ] 确认 sample dataset 当前结构。
- [ ] 确认 upload / ingest / conversation service 可复用。
- [ ] 确认 reset 不需要硬删除真实数据。

## 实现后

- [ ] 新增 5 个任务文档。
- [ ] Dataset 支持多文档。
- [ ] `demo:seed` 支持 `--reset`。
- [ ] `demo:seed` 支持 `--no-ingest`。
- [ ] `demo:seed` 支持 `--graph` / `--no-graph`。
- [ ] `demo:reset` 可调用同一入口。
- [ ] 输出包含登录信息、Space、Documents、Conversation、Questions、Commands。
- [ ] 不输出 API key、prompt、answer、完整正文。
- [ ] `pnpm format:check` 通过。
- [ ] `pnpm lint` 通过。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。

## Smoke

- [ ] `pnpm demo:seed --no-ingest` 能生成 demo 数据。
- [ ] `pnpm demo:seed --reset --no-ingest` 可重复执行。
- [ ] 如 provider 可用，`pnpm demo:seed --reset --no-graph` 可生成 READY 文档。
