'use client';

import { DemoEmptyState } from '@/components/demo';
import type { MetricsBreakdown } from '@/types/observability';

interface MetricsBreakdownPanelProps {
  breakdown: MetricsBreakdown | null;
  loading: boolean;
  onRefresh: () => void;
}

const metricLabels: Array<{ key: keyof MetricsBreakdown; label: string }> = [
  { key: 'agent', label: 'Agent' },
  { key: 'retrieval', label: 'Retrieval' },
  { key: 'llm', label: 'LLM' },
  { key: 'ingestion', label: 'Ingestion' },
  { key: 'documentProcessing', label: 'Document Processing' },
  { key: 'embedding', label: 'Embedding' },
  { key: 'reranker', label: 'Reranker' },
  { key: 'vector', label: 'Vector' },
  { key: 'storage', label: 'Storage' },
  { key: 'memory', label: 'Memory' },
  { key: 'providerHealth', label: 'Provider Health' },
];

export function MetricsBreakdownPanel({
  breakdown,
  loading,
  onRefresh,
}: MetricsBreakdownPanelProps) {
  const presentCount = breakdown ? Object.values(breakdown).filter(Boolean).length : 0;

  return (
    <section className="workbench-panel metrics-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Metrics Breakdown</h2>
          <span>{breakdown ? `${presentCount}/${metricLabels.length} metric groups` : '-'}</span>
        </div>
        <span className={`status-pill status-pill--${breakdown ? 'ready' : 'unknown'}`}>
          {loading ? 'loading' : 'metrics'}
        </span>
      </div>

      {!breakdown && !loading ? (
        <DemoEmptyState title="No Metrics" action="Refresh metrics from /metrics." />
      ) : null}

      <div className="metrics-breakdown">
        {metricLabels.map((metric) => {
          const exists = Boolean(breakdown?.[metric.key]);

          return (
            <div className="metrics-breakdown__item" key={metric.key}>
              <strong>{metric.label}</strong>
              <span className={`status-pill status-pill--${exists ? 'success' : 'unknown'}`}>
                {exists ? 'present' : 'missing'}
              </span>
            </div>
          );
        })}
      </div>

      <button
        className="workbench-button workbench-button--secondary"
        disabled={loading}
        onClick={onRefresh}
        type="button"
      >
        Refresh Metrics
      </button>
    </section>
  );
}
