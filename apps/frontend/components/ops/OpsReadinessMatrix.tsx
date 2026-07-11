'use client';

import type { ReadinessCheck } from '@/types/observability';

interface OpsReadinessMatrixProps {
  checks: ReadinessCheck[];
}

const labelByName: Record<ReadinessCheck['name'], string> = {
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

export function OpsReadinessMatrix({ checks }: OpsReadinessMatrixProps) {
  return (
    <section className="ops-panel">
      <header>
        <div>
          <h3>Provider Matrix</h3>
          <span>Configuration, connectivity, and inference readiness.</span>
        </div>
      </header>
      <div className="ops-readiness-grid">
        {checks.map((check) => (
          <article className={`ops-readiness ops-readiness--${check.status}`} key={check.name}>
            <strong>{labelByName[check.name]}</strong>
            <span>{check.status}</span>
            <small>{check.code ?? check.stage ?? check.message ?? '-'}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
