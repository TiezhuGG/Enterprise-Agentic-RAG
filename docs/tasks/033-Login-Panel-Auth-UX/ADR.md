# TASK-033：架构决策记录

## 决策 1：登录面板嵌入 Demo Workbench

不新增独立路由页面。

原因：

- MVP 演示是单页闭环。
- 用户需要在同一屏完成 Login -> Space -> Upload -> Agent。

后果：

- `AuthPanel` 仍放在 sidebar。
- 无需新增 app route。

## 决策 2：保留 Manual Token

默认提供 email/password 登录，同时保留手动 token。

原因：

- 本地调试、外部脚本、临时 token 仍然有价值。
- 不影响用户演示主路径。

后果：

- 登录成功可显示 user email。
- Manual Token 模式只显示 token saved，不显示 user。

## 决策 3：不新增 Auth Store

Auth 状态放入 `workbench.store.ts`。

原因：

- 当前 Workbench 的数据刷新依赖 token。
- 登录成功后需要立即刷新 Space / Document。

后果：

- `workbench.store` 负责登录、登出、token 保存和业务状态清理。
- 其他 store 继续通过 `api-client` 读取已保存 token。

## 决策 4：未登录时不请求受保护资源

`initialize()` 读取不到 token 时不调用 `/spaces`。

原因：

- 避免无意义 401 错误污染 UI。
- Auth checklist 能明确提示先登录。

后果：

- 用户登录或保存 Manual Token 后再加载业务数据。

## 决策 5：不展示 token

UI 不显示完整 accessToken。

原因：

- 避免演示截图泄露凭证。

后果：

- 只显示登录用户 email 或 token saved 状态。
