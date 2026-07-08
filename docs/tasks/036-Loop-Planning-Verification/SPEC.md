# TASK-036：Loop Planning + Verification

## 目标

在 LangGraph runtime 上增加有限循环能力。

当回答缺少上下文或 Verification 判断不充分时，允许 Agent 二次检索或补充 Graph Context。

## 状态扩展

扩展 `AgentState`：

```ts
iteration: number;
maxIterations: number;
verificationResult: VerificationResult | null;
needsMoreContext: boolean;
followUpQuery?: string;
```

## Planner 扩展

Planner 输出支持：

```ts
{
  needsRetrieval: boolean;
  needsGraph: boolean;
  queryRewrite?: string;
}
```

## Verification 扩展

Verification Node 决定：

- answer grounded -> END
- context insufficient -> 回到 retrieval / graph
- max iterations reached -> END with best effort

## Streaming 事件

新增可选事件：

- `iteration`
- `verification`

保持旧事件兼容。

## 禁止项

- 不做 Multi-Agent。
- 不做外部工具调用。
- 不做 Autonomous Agent。
- 不改变已有 Agent API 请求结构。

## 验收标准

- 检索不足时可二次检索。
- max iterations 生效。
- verification 可阻止无限循环。
- trace 能展示多轮节点。
- 旧前端事件仍兼容。
- `pnpm format:check` 通过。
- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
