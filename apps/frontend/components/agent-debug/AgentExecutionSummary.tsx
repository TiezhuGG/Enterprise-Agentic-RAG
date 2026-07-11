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

  return value ? '是' : '否';
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
          <h2>执行记录</h2>
          <span>{executionId ?? '等待执行'}</span>
        </div>
        <span className={`status-pill status-pill--${running ? 'running' : 'idle'}`}>
          {running ? '运行中' : '待执行'}
        </span>
      </div>

      {executionId ? (
        <button
          className="workbench-button workbench-button--secondary agent-debug-summary__timeline"
          onClick={() => onOpenTimeline(executionId)}
          type="button"
        >
          查看时间线
        </button>
      ) : null}

      <dl className="agent-debug-summary__grid">
        <div>
          <dt>已检索</dt>
          <dd>{boolLabel(plannerDecision?.needsRetrieval)}</dd>
        </div>
        <div>
          <dt>使用图谱</dt>
          <dd>{boolLabel(plannerDecision?.needsGraph)}</dd>
        </div>
        <div>
          <dt>引用片段</dt>
          <dd>{retrievalCount ?? '-'}</dd>
        </div>
        <div>
          <dt>图谱上下文</dt>
          <dd>{graphCount ?? '-'}</dd>
        </div>
        <div>
          <dt>已验证</dt>
          <dd>{boolLabel(finalResponse?.metadata.verified)}</dd>
        </div>
        <div>
          <dt>迭代次数</dt>
          <dd>
            {finalResponse?.metadata.iteration
              ? `${finalResponse.metadata.iteration}/${finalResponse.metadata.maxIterations ?? '-'}`
              : '-'}
          </dd>
        </div>
        <div>
          <dt>使用记忆</dt>
          <dd>{boolLabel(finalResponse?.metadata.usedMemory)}</dd>
        </div>
        <div>
          <dt>验证原因</dt>
          <dd>{finalResponse?.metadata.verificationResult?.reason ?? '-'}</dd>
        </div>
      </dl>
    </section>
  );
}
