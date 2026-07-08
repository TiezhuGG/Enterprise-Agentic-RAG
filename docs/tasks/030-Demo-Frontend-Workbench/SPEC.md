# TASK-030：Demo Frontend Workbench Foundation

## 目标

TASK-030 建立 MVP Demo Frontend Workbench 第一版。

当前前端只有 Assistant Chat UI，无法从浏览器完成“创建 Space -> 上传 Document -> 执行 Ingestion -> 查看 Pipeline Timeline -> 进入 Chat 提问”的演示闭环。本任务在现有 `apps/frontend` 内新增工作台基座和 Document Pipeline 面板，复用 TASK-026~029 已有后端 API。

## 范围

新增：

```text
docs/tasks/030-Demo-Frontend-Workbench/
├── SPEC.md
├── SEQUENCE.md
├── ADR.md
├── REVIEW.md
└── CODEX.md

apps/frontend/components/workbench/
apps/frontend/services/
apps/frontend/store/workbench.store.ts
apps/frontend/types/workbench.ts
```

修改：

```text
apps/frontend/app/page.tsx
apps/frontend/app/globals.css
```

## 前端服务

新增或扩展：

```text
knowledge-space.service.ts
document.service.ts
upload.service.ts
ingestion.service.ts
pipeline.service.ts
```

要求：

- 页面和组件禁止直接 `fetch`。
- API 访问路径为 `Component -> Store -> Service -> API`。
- 复用 `api-client.ts` 的 `createApiUrl()`、`createJsonHeaders()`、`getAuthToken()` 和 `readApiError()`。

## 工作台状态

新增：

```text
store/workbench.store.ts
```

保存：

- `authToken`
- `spaces`
- `selectedSpaceId`
- `documents`
- `selectedDocumentId`
- `uploadState`
- `ingestionState`
- `pipelineJobs`
- `pipelineEvents`
- `documentMetadata`
- `error`

## UI 组件

新增：

```text
components/workbench/
├── DemoWorkbench.tsx
├── AuthTokenPanel.tsx
├── SpaceSwitcher.tsx
├── DocumentListPanel.tsx
├── DocumentUploadPanel.tsx
├── IngestionPanel.tsx
├── PipelineTimeline.tsx
└── DocumentMetadataPanel.tsx
```

## 页面行为

- 首页渲染 `DemoWorkbench`。
- 工作台顶部或侧边栏保留 JWT Token 输入。
- 用户可创建 Knowledge Space。
- 用户可选择 Knowledge Space。
- 选择 Space 后自动加载 Document 列表。
- 用户可上传 PDF / TXT / Markdown / Word 等后端允许的文件。
- 上传成功后刷新 Document 列表并选中新文档。
- 用户可对选中文档触发 Ingestion。
- Ingestion 默认参数：
  - `force=true`
  - `includeEmbedding=true`
  - `includeGraph=false`
- Ingestion 返回 `pipelineJobId` 后自动加载 Pipeline Events。
- Timeline 展示阶段、状态、耗时、错误信息和安全 metadata。
- Metadata 面板只展示 DocumentContent metadata，不展示正文。
- 保留现有 `ChatWindow`，作为 Workbench 的 Assistant 区域或标签页。

## 禁止项

- 不新增后端领域能力。
- 不新增后端 API，除非现有 API 无法完成闭环。
- 不实现文档编辑。
- 不实现 Role / Permission 管理。
- 不实现 Graph 可视化。
- 不实现 Agent Debug Workbench。
- 不引入大型 UI 组件库。
- 不让 React 组件直接调用 `fetch`。
- 不展示完整文档正文。

## 验收标准

- 可以输入并保存 JWT token。
- 可以创建并选择 Space。
- 可以查看 Space 下 Document 列表。
- 可以上传 Document。
- 可以触发 Ingestion。
- 可以看到 Ingestion 结果和 Pipeline Timeline。
- 可以查看 Document metadata。
- 可以切换到 Assistant Chat。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。

## Smoke 流程

```text
1. 输入 JWT token
2. 创建或选择 Space
3. 上传 PDF/TXT/Markdown 文档
4. 点击 Ingest
5. 确认文档状态进入 READY 或失败时显示原因
6. 确认 Pipeline Timeline 有阶段事件
7. 打开 metadata 面板，确认不显示正文
8. 切到 Chat，基于已 ingest 的 Space 提问
```
