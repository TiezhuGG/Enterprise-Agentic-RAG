'use client';

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
        {answer ? <p>{answer}</p> : <p className="workbench-empty">No answer.</p>}
      </div>
    </section>
  );
}
