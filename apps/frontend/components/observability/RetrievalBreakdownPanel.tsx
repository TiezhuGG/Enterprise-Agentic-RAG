'use client';

import type { ExecutionTraceEvent } from '@/types/observability';

interface RetrievalBreakdownPanelProps {
  event: ExecutionTraceEvent;
}

interface RetrievalStageView {
  count: number | null;
  durationMs: number | null;
  label: string;
  status?: string;
}

const toNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return '-';
  }

  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(2)} s`;
};

const formatCount = (count: number | null): string => (count === null ? '-' : String(count));

const hasRetrievalBreakdown = (metadata: Record<string, unknown>): boolean =>
  [
    'vectorCount',
    'keywordCount',
    'graphCount',
    'filteredCount',
    'rrfCount',
    'rerankedCount',
    'contextCount',
  ].some((key) => typeof metadata[key] === 'number');

export function RetrievalBreakdownPanel({ event }: RetrievalBreakdownPanelProps) {
  const metadata = event.metadata;

  if (!hasRetrievalBreakdown(metadata)) {
    return null;
  }

  const stages: RetrievalStageView[] = [
    {
      count: toNumber(metadata.vectorCount),
      durationMs: toNumber(metadata.vectorDurationMs),
      label: 'Vector',
    },
    {
      count: toNumber(metadata.keywordCount),
      durationMs: toNumber(metadata.keywordDurationMs),
      label: 'Keyword',
    },
    {
      count: toNumber(metadata.graphCount),
      durationMs: toNumber(metadata.graphDurationMs),
      label: 'Graph',
      status: typeof metadata.graphStatus === 'string' ? metadata.graphStatus : undefined,
    },
    {
      count: toNumber(metadata.filteredCount),
      durationMs: toNumber(metadata.permissionFilterDurationMs),
      label: 'Policy',
    },
    {
      count: toNumber(metadata.rrfCount),
      durationMs: toNumber(metadata.rrfDurationMs),
      label: 'RRF',
    },
    {
      count: toNumber(metadata.rerankedCount),
      durationMs: toNumber(metadata.rerankerDurationMs),
      label: 'Rerank',
    },
    {
      count: toNumber(metadata.contextCount),
      durationMs: toNumber(metadata.contextBuilderDurationMs),
      label: 'Context',
    },
  ];

  return (
    <div className="retrieval-breakdown" aria-label="Retrieval breakdown">
      <div className="retrieval-breakdown__summary">
        <span>{formatCount(toNumber(metadata.scopedSpaceCount))} spaces</span>
        <span>{formatDuration(toNumber(metadata.retrievalDurationMs))}</span>
      </div>
      <div className="retrieval-breakdown__grid">
        {stages.map((stage) => (
          <div className="retrieval-breakdown__stage" key={stage.label}>
            <strong>{stage.label}</strong>
            <span>{formatCount(stage.count)} results</span>
            <span>{formatDuration(stage.durationMs)}</span>
            {stage.status ? <span>{stage.status}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
