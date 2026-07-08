'use client';

import { DemoEmptyState } from '@/components/demo';
import type { ExecutionRun } from '@/types/observability';
import { ExecutionMetadataInspector } from './ExecutionMetadataInspector';

interface ExecutionRunDetailPanelProps {
  run: ExecutionRun | null;
  timelineCount: number;
}

const shortId = (value: string): string =>
  value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return '-';
  }

  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(2)} s`;
};

export function ExecutionRunDetailPanel({ run, timelineCount }: ExecutionRunDetailPanelProps) {
  if (!run) {
    return (
      <section className="workbench-panel">
        <div className="workbench-panel__header">
          <div>
            <h2>Run Detail</h2>
            <span>no selection</span>
          </div>
        </div>
        <DemoEmptyState title="No Execution Selected" action="Select a run from the list." />
      </section>
    );
  }

  return (
    <div className="execution-detail-stack">
      <section className="workbench-panel execution-detail-panel">
        <div className="workbench-panel__header">
          <div>
            <h2>Run Detail</h2>
            <span>{shortId(run.executionId)}</span>
          </div>
          <span className={`status-pill status-pill--${run.status.toLowerCase()}`}>
            {run.status}
          </span>
        </div>

        <dl className="execution-detail-grid">
          <div>
            <dt>Source</dt>
            <dd>{run.source}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{formatDuration(run.durationMs)}</dd>
          </div>
          <div>
            <dt>Request</dt>
            <dd>{shortId(run.requestId)}</dd>
          </div>
          <div>
            <dt>Events</dt>
            <dd>{timelineCount}</dd>
          </div>
          <div>
            <dt>Conversation</dt>
            <dd>{run.conversationId ? shortId(run.conversationId) : '-'}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{new Date(run.startedAt).toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <ExecutionMetadataInspector metadata={run.metadata} title="Run Metadata" />
    </div>
  );
}
