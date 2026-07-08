# TASK-036：流程设计

## 正常流程

```text
memory
↓
planner
↓
retrieval / graph
↓
answer
↓
verification
↓
verified -> END
```

## 补充上下文流程

```text
verification: needsMoreContext=true
↓
iteration + 1
↓
生成 followUpQuery
↓
retrieval / graph
↓
answer
↓
verification
```

## 终止条件

```text
verified=true
or
needsMoreContext=false
or
iteration >= maxIterations
```

## Streaming

每一轮开始发送：

```text
iteration
```

Verification 后发送：

```text
verification
```

旧事件保持不变。
