# TASK-033：流程设计

## 登录流程

```text
用户输入 email/password
↓
AuthPanel.submit
↓
WorkbenchStore.login(email, password)
↓
authService.login()
↓
POST /auth/login
↓
保存 accessToken
↓
保存 authUser
↓
刷新 Space / Document
```

## Manual Token 流程

```text
用户展开 Manual Token
↓
粘贴 JWT
↓
WorkbenchStore.setAuthToken(token)
↓
保存 token
↓
刷新 Space / Document
```

Manual Token 不解析 user，Checklist 使用 token fallback。

## Logout 流程

```text
用户点击 Logout
↓
WorkbenchStore.clearAuth()
↓
清空 localStorage token
↓
清空 authUser
↓
清空 Space / Document / Pipeline / Metadata / Ingestion 状态
```

## 错误流程

```text
POST /auth/login 失败
↓
authError = 短错误
↓
authLoading = false
↓
不展示 password
↓
不展示 accessToken
```

## 初始化流程

```text
DemoWorkbench mount
↓
WorkbenchStore.initialize()
↓
读取 localStorage token
↓
如果无 token：不请求受保护资源
↓
如果有 token：加载 spaces
```

这样未登录时不会因为 `/spaces` 401 产生噪音错误。
