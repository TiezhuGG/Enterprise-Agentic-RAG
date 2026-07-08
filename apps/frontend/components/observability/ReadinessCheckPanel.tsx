'use client';

import { DemoEmptyState } from '@/components/demo';
import type { ReadinessCheck, ReadinessResponse } from '@/types/observability';

interface ReadinessCheckPanelProps {
  loading: boolean;
  onRefresh: () => void;
  readiness: ReadinessResponse | null;
}

const checkLabels: Record<ReadinessCheck['name'], string> = {
  database: 'Database',
  embedding: 'Embedding',
  graph: 'Graph',
  llm: 'LLM',
  redis: 'Redis',
  reranker: 'Reranker',
  storage: 'Storage',
  vector: 'Vector',
};

const formatDuration = (durationMs?: number): string => {
  if (durationMs === undefined) {
    return '-';
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
};

const shortMessage = (message?: string): string =>
  message ? message.replace(/\s+/g, ' ').slice(0, 120) : '';

export function ReadinessCheckPanel({ loading, onRefresh, readiness }: ReadinessCheckPanelProps) {
  const status = readiness?.status ?? 'degraded';

  return (
    <section className="workbench-panel readiness-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Provider Readiness</h2>
          <span>{readiness ? new Date(readiness.timestamp).toLocaleString() : 'unchecked'}</span>
        </div>
        <span className={`status-pill status-pill--${status}`}>
          {loading ? 'checking' : status}
        </span>
      </div>

      {!readiness && !loading ? (
        <DemoEmptyState title="No Readiness" action="Refresh provider readiness." />
      ) : null}

      <div className="readiness-checks">
        {readiness?.checks.map((check) => (
          <article className="readiness-check" key={check.name}>
            <div className="readiness-check__top">
              <strong>{checkLabels[check.name]}</strong>
              <span className={`status-pill status-pill--${check.status}`}>{check.status}</span>
            </div>
            <div className="readiness-check__meta">
              <span>{formatDuration(check.durationMs)}</span>
              {check.message ? <span>{shortMessage(check.message)}</span> : null}
            </div>
          </article>
        ))}
      </div>

      <button
        className="workbench-button workbench-button--secondary"
        disabled={loading}
        onClick={onRefresh}
        type="button"
      >
        Refresh Readiness
      </button>
    </section>
  );
}
