'use client';

import type { AgentDebugPlannerDecision } from '@/store/agent-debug.store';
import type { AgentResponse } from '@/types/agent';

interface AgentExecutionSummaryProps {
  executionId: string | null;
  finalResponse: AgentResponse | null;
  graphCount: number | null;
  plannerDecision: AgentDebugPlannerDecision | null;
  retrievalCount: number | null;
  running: boolean;
  onOpenTimeline: (executionId: string) => void;
}

const boolLabel = (value: boolean | undefined): string => {
  if (value === undefined) {
    return '-';
  }

  return value ? 'Yes' : 'No';
};

export function AgentExecutionSummary({
  executionId,
  finalResponse,
  graphCount,
  plannerDecision,
  retrievalCount,
  running,
  onOpenTimeline,
}: AgentExecutionSummaryProps) {
  return (
    <section className="workbench-panel agent-debug-summary">
      <div className="workbench-panel__header">
        <div>
          <h2>Execution</h2>
          <span>{executionId ?? 'waiting'}</span>
        </div>
        <span className={`status-pill status-pill--${running ? 'running' : 'idle'}`}>
          {running ? 'running' : 'idle'}
        </span>
      </div>

      {executionId ? (
        <button
          className="workbench-button workbench-button--secondary agent-debug-summary__timeline"
          onClick={() => onOpenTimeline(executionId)}
          type="button"
        >
          Open Timeline
        </button>
      ) : null}

      <dl className="agent-debug-summary__grid">
        <div>
          <dt>Retrieval</dt>
          <dd>{boolLabel(plannerDecision?.needsRetrieval)}</dd>
        </div>
        <div>
          <dt>Graph</dt>
          <dd>{boolLabel(plannerDecision?.needsGraph)}</dd>
        </div>
        <div>
          <dt>Chunks</dt>
          <dd>{retrievalCount ?? '-'}</dd>
        </div>
        <div>
          <dt>Graph Context</dt>
          <dd>{graphCount ?? '-'}</dd>
        </div>
        <div>
          <dt>Verified</dt>
          <dd>{boolLabel(finalResponse?.metadata.verified)}</dd>
        </div>
        <div>
          <dt>Iteration</dt>
          <dd>
            {finalResponse?.metadata.iteration
              ? `${finalResponse.metadata.iteration}/${finalResponse.metadata.maxIterations ?? '-'}`
              : '-'}
          </dd>
        </div>
        <div>
          <dt>Memory</dt>
          <dd>{boolLabel(finalResponse?.metadata.usedMemory)}</dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{finalResponse?.metadata.verificationResult?.reason ?? '-'}</dd>
        </div>
      </dl>
    </section>
  );
}
