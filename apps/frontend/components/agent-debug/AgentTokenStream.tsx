'use client';

import { AgentDebugEmptyState } from './AgentDebugEmptyState';

interface AgentTokenStreamProps {
  answer: string;
  running: boolean;
}

export function AgentTokenStream({ answer, running }: AgentTokenStreamProps) {
  return (
    <section className="workbench-panel agent-debug-token-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>回答流</h2>
          <span>{running ? '生成中' : `${answer.length} 字符`}</span>
        </div>
      </div>

      <div className="agent-debug-token-stream">
        {answer ? (
          <p>{answer}</p>
        ) : (
          <AgentDebugEmptyState title="暂无回答" action="运行问题后会显示模型输出。" />
        )}
      </div>
    </section>
  );
}
