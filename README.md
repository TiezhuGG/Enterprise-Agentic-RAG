# Enterprise Agentic RAG

Enterprise Agentic RAG 是一个面向企业级 Agentic RAG 系统的 monorepo 工程骨架。

当前任务仅完成工程初始化，不包含登录、数据库访问、AI 能力、业务模块或任何业务接口实现。

## 目录结构

```text
enterprise-agentic-rag/
├─ apps/
│  ├─ backend/
│  │  └─ src/
│  │     ├─ common/
│  │     ├─ config/
│  │     ├─ infrastructure/
│  │     ├─ modules/
│  │     ├─ app.module.ts
│  │     └─ main.ts
│  └─ frontend/
│     ├─ app/
│     ├─ components/
│     ├─ hooks/
│     ├─ lib/
│     ├─ services/
│     ├─ store/
│     └─ types/
├─ packages/
│  ├─ shared/
│  └─ sdk/
├─ docker/
├─ docs/
├─ scripts/
├─ .github/
└─ .husky/
```

## 技术栈

- Monorepo: pnpm workspace
- Backend: NestJS
- Frontend: Next.js App Router
- 工程规范: ESLint, Prettier, EditorConfig, Husky, lint-staged, Commitlint
- 本地基础设施: Postgres, Redis, MinIO

## 启动

安装依赖：

```bash
pnpm install
```

启动基础设施：

```bash
pnpm docker:up
```

启动后端：

```bash
pnpm dev:backend
```

启动前端：

```bash
pnpm dev:frontend
```

同时启动前后端：

```bash
pnpm dev
```

关闭基础设施：

```bash
pnpm docker:down
```

## 开发规范

- 统一使用 pnpm，不使用 npm 或 yarn。
- 提交信息遵循 Conventional Commits。
- 提交前通过 Husky 执行 lint-staged。
- 使用 ESLint 检查代码质量。
- 使用 Prettier 统一格式化。
- 新增业务代码前，应先完成对应模块边界、配置约定和测试策略设计。

## 当前边界

本工程初始化阶段只包含项目骨架、开发工具链配置和本地基础设施编排。

以下内容尚未实现：

- 登录
- 数据库访问层
- AI 或 RAG 能力
- 后端业务接口
- 前端页面
