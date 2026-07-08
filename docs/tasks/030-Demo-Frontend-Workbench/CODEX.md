# TASK-030：Codex 实现提示词

你是 Enterprise Agentic RAG 项目的前端架构工程师。

请严格遵守当前架构，实现 Demo Frontend Workbench Foundation。

## 必须先阅读

```text
docs/tasks/030-Demo-Frontend-Workbench/SPEC.md
docs/tasks/030-Demo-Frontend-Workbench/SEQUENCE.md
docs/tasks/030-Demo-Frontend-Workbench/ADR.md
docs/tasks/030-Demo-Frontend-Workbench/REVIEW.md
docs/tasks/030-Demo-Frontend-Workbench/CODEX.md
```

## 目标

让前端可以完成：

```text
Space
↓
Document Upload
↓
Ingestion
↓
Pipeline Timeline
↓
Metadata
↓
Assistant Chat
```

## 必须新增

服务：

```text
apps/frontend/services/knowledge-space.service.ts
apps/frontend/services/document.service.ts
apps/frontend/services/upload.service.ts
apps/frontend/services/ingestion.service.ts
apps/frontend/services/pipeline.service.ts
```

类型：

```text
apps/frontend/types/workbench.ts
```

状态：

```text
apps/frontend/store/workbench.store.ts
```

组件：

```text
apps/frontend/components/workbench/
├── DemoWorkbench.tsx
├── AuthTokenPanel.tsx
├── SpaceSwitcher.tsx
├── DocumentListPanel.tsx
├── DocumentUploadPanel.tsx
├── IngestionPanel.tsx
├── PipelineTimeline.tsx
└── DocumentMetadataPanel.tsx
```

修改：

```text
apps/frontend/app/page.tsx
apps/frontend/app/globals.css
```

## 架构要求

必须保持：

```text
Component
↓
Store
↓
Service
↓
API
```

禁止：

- 组件直接 `fetch`。
- 引入大型 UI 组件库。
- 新增后端领域能力。
- 展示完整文档正文。
- 回退 TASK-029 未提交改动。

## 默认行为

Ingestion 默认：

```ts
{
  force: true,
  includeEmbedding: true,
  includeGraph: false,
}
```

## 验证

执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

输出：

- 修改文件
- 新增组件
- API 说明
- 测试结果
- 后续 TASK-031 建议
