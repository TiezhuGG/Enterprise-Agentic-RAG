# TASK-032：架构决策记录

## 决策 1：不新增后端 API

TASK-032 只做演示体验打磨。

原因：

- `/health` 和 `/metrics` 已存在。
- TASK-030/031 已经覆盖核心演示能力。
- 本任务目标是降低演示摩擦，不改变业务能力。

后果：

- 前端只新增 `system.service.ts`。
- 后端保持不变。

## 决策 2：Readiness 只解析关键指标是否存在

Metrics 第一版不做完整 Prometheus 展示。

原因：

- 完整 metrics UI 属于后续 Observability 深化。
- 演示时只需要判断关键链路是否跑过。

后果：

- `DemoMetricsSummary` 使用 boolean 表达关键指标是否出现。
- 不展示完整 metrics 文本。

## 决策 3：新增 demo.store

Readiness 和 demo checklist 不放入 `workbench.store`。

原因：

- Workbench store 管理业务资源状态。
- Demo store 管理演示状态和系统就绪状态。
- 分离后更容易在 TASK-033 继续扩展可观测性。

后果：

- `DemoGuidePanel` 同时读取 `demo.store` 和 `workbench.store`。
- 组件仍然不直接请求 API。

## 决策 4：示例问题只填充，不自动执行

点击示例问题不会自动请求 Agent。

原因：

- 避免误触发昂贵模型调用。
- 保持演示者对执行时机的控制。

后果：

- `DemoQuestionBank` 只调用 `setQuestion()`。

## 决策 5：空状态是操作状态，不是说明文档

空状态保持短句，不写长篇教程。

原因：

- 企业工具界面需要安静、可扫描。
- 详细演示脚本已经在 `docs/demo` 中维护。

后果：

- UI 中只显示当前状态和下一步。
