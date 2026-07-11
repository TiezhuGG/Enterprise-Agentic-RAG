'use client';

import type { OpsCountByStatus, OpsExecutionRun } from '@/types/ops';

interface OpsExecutionDigestProps {
  counts: OpsCountByStatus[];
  runs: OpsExecutionRun[];
}

const shortId = (value: string): string =>
  value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return '-';
  }

  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(2)} s`;
};

export function OpsExecutionDigest({ counts, runs }: OpsExecutionDigestProps) {
  return (
    <section className="ops-panel">
      <header>
        <div>
          <h3>Execution Digest</h3>
          <span>Recent agent workflow executions for the current user.</span>
        </div>
      </header>

      <div className="ops-status-row">
        {counts.length === 0 ? <span>No execution runs</span> : null}
        {counts.map((item) => (
          <span
            className={`status-pill status-pill--${item.status.toLowerCase()}`}
            key={item.status}
          >
            {item.status}: {item.count}
          </span>
        ))}
      </div>

      <div className="ops-list">
        {runs.map((run) => (
          <article className="ops-list-item" key={run.executionId}>
            <div>
              <strong>{run.source}</strong>
              <span>{shortId(run.executionId)}</span>
            </div>
            <div>
              <span className={`status-pill status-pill--${run.status.toLowerCase()}`}>
                {run.status}
              </span>
              <small>{formatDuration(run.durationMs)}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
