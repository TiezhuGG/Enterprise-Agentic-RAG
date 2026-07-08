'use client';

import { useDemoStore } from '@/store/demo.store';

const formatUptime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }

  return `${(seconds / 3600).toFixed(1)}h`;
};

export function SystemReadinessPanel() {
  const error = useDemoStore((state) => state.error);
  const health = useDemoStore((state) => state.health);
  const lastCheckedAt = useDemoStore((state) => state.lastCheckedAt);
  const loading = useDemoStore((state) => state.loading);
  const metricsSummary = useDemoStore((state) => state.metricsSummary);
  const readiness = useDemoStore((state) => state.readiness);
  const refresh = useDemoStore((state) => state.refresh);
  const metricCount = metricsSummary ? Object.values(metricsSummary).filter(Boolean).length : 0;

  return (
    <section className="workbench-panel workbench-panel--compact system-readiness">
      <div className="workbench-panel__header">
        <div>
          <h2>System</h2>
          <span>{lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString() : 'unchecked'}</span>
        </div>
        <span className={`status-pill status-pill--${readiness}`}>
          {loading ? 'checking' : readiness}
        </span>
      </div>

      <dl className="system-readiness__grid">
        <div>
          <dt>Health</dt>
          <dd>{health?.status ?? '-'}</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd>{health ? formatUptime(health.uptimeSeconds) : '-'}</dd>
        </div>
        <div>
          <dt>Metrics</dt>
          <dd>{metricsSummary ? `${metricCount}/5` : '-'}</dd>
        </div>
      </dl>

      {error ? <p className="system-readiness__error">{error}</p> : null}

      <button
        className="workbench-button workbench-button--secondary"
        disabled={loading}
        onClick={() => void refresh()}
        type="button"
      >
        Refresh
      </button>
    </section>
  );
}
