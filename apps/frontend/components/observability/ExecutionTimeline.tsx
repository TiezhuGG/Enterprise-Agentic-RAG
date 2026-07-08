'use client';

import { useMemo } from 'react';
import { DemoEmptyState } from '@/components/demo';
import type { ExecutionTraceEvent } from '@/types/observability';
import { formatSafeMetadata } from './ExecutionMetadataInspector';

interface ExecutionTimelineProps {
  events: ExecutionTraceEvent[];
  loading: boolean;
  onRefresh: () => void;
  selectedExecutionId: string | null;
}

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return '-';
  }

  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(2)} s`;
};

const sortEvents = (events: ExecutionTraceEvent[]): ExecutionTraceEvent[] =>
  [...events].sort((left, right) => left.sequence - right.sequence);

export function ExecutionTimeline({
  events,
  loading,
  onRefresh,
  selectedExecutionId,
}: ExecutionTimelineProps) {
  const sortedEvents = useMemo(() => sortEvents(events), [events]);

  return (
    <section className="workbench-panel execution-timeline-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Execution Timeline</h2>
          <span>{selectedExecutionId ? `${sortedEvents.length} events` : 'no execution'}</span>
        </div>
        <button
          className="workbench-button workbench-button--secondary"
          disabled={loading || !selectedExecutionId}
          onClick={onRefresh}
          type="button"
        >
          Refresh Timeline
        </button>
      </div>

      {!selectedExecutionId ? (
        <DemoEmptyState title="No Timeline" action="Select an execution run." />
      ) : null}

      {selectedExecutionId && !loading && sortedEvents.length === 0 ? (
        <DemoEmptyState
          title="No Events Yet"
          action="Refresh after the run has finished writing."
        />
      ) : null}

      {loading ? <p className="workbench-empty">Loading timeline...</p> : null}

      <ol className="execution-timeline">
        {sortedEvents.map((event) => {
          const metadata = formatSafeMetadata(event.metadata);

          return (
            <li
              className={`execution-timeline__item execution-timeline__item--${event.status.toLowerCase()}`}
              key={event.id}
            >
              <span className="execution-timeline__marker" aria-hidden="true" />
              <div className="execution-timeline__body">
                <div className="execution-timeline__top">
                  <strong>{event.stage}</strong>
                  <span className={`status-pill status-pill--${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>
                <div className="execution-timeline__meta">
                  <span>{event.type}</span>
                  <span>{event.node ?? '-'}</span>
                  <span>{formatDuration(event.durationMs)}</span>
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                {event.errorMessage ? (
                  <p className="workbench-error workbench-error--inline">
                    {event.errorMessage.slice(0, 180)}
                  </p>
                ) : null}
                {metadata ? (
                  <details className="execution-timeline__details">
                    <summary>safe metadata</summary>
                    <pre>{metadata}</pre>
                  </details>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
