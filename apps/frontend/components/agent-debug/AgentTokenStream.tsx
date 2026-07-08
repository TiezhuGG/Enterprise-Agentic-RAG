'use client';

import { DemoEmptyState } from '@/components/demo';

interface AgentTokenStreamProps {
  answer: string;
  running: boolean;
}

export function AgentTokenStream({ answer, running }: AgentTokenStreamProps) {
  return (
    <section className="workbench-panel agent-debug-token-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Answer Stream</h2>
          <span>{running ? 'streaming' : `${answer.length} chars`}</span>
        </div>
      </div>

      <div className="agent-debug-token-stream">
        {answer ? (
          <p>{answer}</p>
        ) : (
          <DemoEmptyState title="No Answer" action="Token output appears while the Agent runs." />
        )}
      </div>
    </section>
  );
}
