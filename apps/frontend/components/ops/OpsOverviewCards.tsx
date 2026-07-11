'use client';

import { Activity, AlertTriangle, CheckCircle2, FileText, Workflow } from 'lucide-react';
import type { OpsSummary } from '@/types/ops';

interface OpsOverviewCardsProps {
  summary: OpsSummary;
}

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return '-';
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
};

export function OpsOverviewCards({ summary }: OpsOverviewCardsProps) {
  const ready = summary.readiness.status === 'ok' && summary.readiness.failedChecks === 0;
  const pipelineHealthy = summary.pipeline.failedLast24h === 0;
  const executionHealthy = summary.executions.failedLast24h === 0;

  return (
    <div className="ops-overview-grid">
      <article
        className={`ops-overview-card ${ready ? 'ops-overview-card--ok' : 'ops-overview-card--warn'}`}
      >
        <CheckCircle2 />
        <span>Readiness</span>
        <strong>{summary.readiness.status}</strong>
        <small>{summary.readiness.failedChecks} failed checks</small>
      </article>
      <article className="ops-overview-card">
        <FileText />
        <span>Documents</span>
        <strong>{summary.documents.total}</strong>
        <small>{summary.documents.byStatus.length} status groups</small>
      </article>
      <article
        className={`ops-overview-card ${pipelineHealthy ? 'ops-overview-card--ok' : 'ops-overview-card--warn'}`}
      >
        <Workflow />
        <span>Pipeline</span>
        <strong>{summary.pipeline.failedLast24h}</strong>
        <small>failed in 24h</small>
      </article>
      <article
        className={`ops-overview-card ${executionHealthy ? 'ops-overview-card--ok' : 'ops-overview-card--warn'}`}
      >
        {executionHealthy ? <Activity /> : <AlertTriangle />}
        <span>Executions</span>
        <strong>{summary.executions.failedLast24h}</strong>
        <small>avg {formatDuration(summary.executions.averageDurationMs)}</small>
      </article>
    </div>
  );
}
