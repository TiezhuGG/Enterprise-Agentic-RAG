'use client';

import type { AgentTraceEntry } from '@/types/agent';
import { DemoEmptyState } from '@/components/demo';

interface AgentTraceTimelineProps {
  trace: AgentTraceEntry[];
}

const formatDuration = (entry: AgentTraceEntry): string => {
  const durationMs = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime();

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return '-';
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
};

export function AgentTraceTimeline({ trace }: AgentTraceTimelineProps) {
  return (
    <section className="workbench-panel agent-debug-trace-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Trace Timeline</h2>
          <span>{trace.length} nodes</span>
        </div>
      </div>

      {trace.length === 0 ? (
        <DemoEmptyState title="No Trace" action="Trace is available after the done event." />
      ) : null}

      <ol className="agent-debug-trace">
        {trace.map((entry) => (
          <li
            className={`agent-debug-trace__item agent-debug-trace__item--${entry.status}`}
            key={`${entry.node}-${entry.startTime}`}
          >
            <span className="agent-debug-trace__marker" aria-hidden="true" />
            <div>
              <div className="agent-debug-trace__top">
                <strong>{entry.node}</strong>
                <span>{entry.status}</span>
              </div>
              <div className="agent-debug-trace__meta">
                <span>{formatDuration(entry)}</span>
                <span>{new Date(entry.startTime).toLocaleTimeString()}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
