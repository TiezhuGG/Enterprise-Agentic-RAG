'use client';

import { DemoEmptyState } from '@/components/demo';
import type { ReadinessCheck, ReadinessResponse } from '@/types/observability';

interface ReadinessCheckPanelProps {
  loading: boolean;
  onRefresh: () => void;
  readiness: ReadinessResponse | null;
}

const checkLabels: Record<ReadinessCheck['name'], string> = {
  asr: 'ASR',
  database: 'Database',
  embedding: 'Embedding',
  graph: 'Graph',
  llm: 'LLM',
  ocr: 'OCR',
  redis: 'Redis',
  reranker: 'Reranker',
  search: 'Search',
  storage: 'Storage',
  vector: 'Vector',
  video: 'Video',
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

const stageLabels: Record<NonNullable<ReadinessCheck['stage']>, string> = {
  configuration: '配置',
  connectivity: '连接',
  inference: '真实调用',
};

const boolLabel = (value?: boolean): string => {
  if (value === undefined) {
    return '-';
  }

  return value ? '是' : '否';
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
              {check.stage ? <span>{stageLabels[check.stage]}</span> : null}
              {check.code ? <span>{check.code}</span> : null}
              {check.message ? <span>{shortMessage(check.message)}</span> : null}
            </div>
            {check.configured !== undefined ||
            check.reachable !== undefined ||
            check.inference !== undefined ? (
              <div className="readiness-check__meta readiness-check__meta--compact">
                <span>配置 {boolLabel(check.configured)}</span>
                <span>连接 {boolLabel(check.reachable)}</span>
                <span>调用 {boolLabel(check.inference)}</span>
              </div>
            ) : null}
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
