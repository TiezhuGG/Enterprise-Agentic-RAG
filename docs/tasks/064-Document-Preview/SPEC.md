# TASK-064：Document Preview

## 目标

实现可用于演示和日常使用的文档预览能力。

用户可以在有权限的前提下查看：

- 原文件预览入口。
- 解析后的 Markdown / 文本预览。
- 预览基础信息。

本任务不做文档编辑、批注、版本管理或全文阅读器。

## Backend

新增 API：

```text
GET /documents/:id/preview
```

Query：

```ts
{
  maxChars?: number;
}
```

默认：

```ts
maxChars = 20000;
max = 50000;
```

返回：

```ts
interface DocumentPreviewResponse {
  document: DocumentEntity;
  parsedContent: {
    available: boolean;
    content: string;
    contentLength: number;
    format: 'markdown';
    maxChars: number;
    truncated: boolean;
  };
  file: {
    available: boolean;
    contentType: string | null;
    filename: string;
    inlineUrl: string | null;
  };
  metadata?: DocumentContentMetadata;
}
```

## 权限

必须复用现有：

- Space member role。
- AccessPolicyService。
- Document accessScope。

无权限用户不能获取 preview。

## Frontend

新增：

```text
components/workbench/DocumentPreviewPanel.tsx
```

能力：

- 展示解析内容预览。
- 展示 preview 状态。
- 支持刷新。
- 提示原文件在线预览/下载由现有文档操作完成。

Admin 文档中心现有预览弹窗增强：

- 原文件可预览时继续展示原文件。
- 原文件不可预览时回退到 parsed content。
- 文档解析后优先提供可读文本。

## 禁止

- 不新增上传能力。
- 不实现文档编辑。
- 不实现批注。
- 不实现版本管理。
- 不绕开 AccessPolicy。
- 不在日志中记录正文。
- 不让组件直接 `fetch`。

## 验收标准

- `GET /documents/:id/preview` 可返回解析内容预览。
- 未解析文档返回 parsed unavailable，但仍返回文件预览信息。
- 无权限用户无法 preview。
- 前端工作台可看到 parsed preview。
- Admin 预览弹窗可 fallback 到 parsed preview。
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
