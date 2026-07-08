'use client';

import { DemoEmptyState } from '@/components/demo';
import type { ExecutionRun } from '@/types/observability';

interface ExecutionRunListProps {
  authenticated: boolean;
  loading: boolean;
  onRefresh: () => void;
  onSelect: (executionId: string) => void;
  runs: ExecutionRun[];
  selectedExecutionId: string | null;
}

const shortId = (value: string): string =>
  value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return '-';
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
};

export function ExecutionRunList({
  authenticated,
  loading,
  onRefresh,
  onSelect,
  runs,
  selectedExecutionId,
}: ExecutionRunListProps) {
  return (
    <section className="workbench-panel execution-run-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Execution Runs</h2>
          <span>{authenticated ? `${runs.length} recent runs` : 'login required'}</span>
        </div>
        <button
          className="workbench-button workbench-button--secondary"
          disabled={loading || !authenticated}
          onClick={onRefresh}
          type="button"
        >
          Refresh
        </button>
      </div>

      {!authenticated ? (
        <DemoEmptyState title="Login Required" action="Login to view your execution history." />
      ) : null}

      {authenticated && !loading && runs.length === 0 ? (
        <DemoEmptyState title="No Executions" action="Run Agent Debug to create an execution." />
      ) : null}

      {loading ? <p className="workbench-empty">Loading executions...</p> : null}

      <div className="execution-run-list">
        {runs.map((run) => (
          <button
            className={`execution-run ${
              run.executionId === selectedExecutionId ? 'execution-run--active' : ''
            }`}
            key={run.executionId}
            onClick={() => onSelect(run.executionId)}
            type="button"
          >
            <div className="execution-run__top">
              <strong>{run.source}</strong>
              <span className={`status-pill status-pill--${run.status.toLowerCase()}`}>
                {run.status}
              </span>
            </div>
            <div className="execution-run__meta">
              <span>{shortId(run.executionId)}</span>
              <span>{formatDuration(run.durationMs)}</span>
            </div>
            <div className="execution-run__meta">
              <span>{shortId(run.requestId)}</span>
              <span>{new Date(run.startedAt).toLocaleString()}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
