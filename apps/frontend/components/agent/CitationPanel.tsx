'use client';

import type { AgentCitation } from '@/types/agent';

interface CitationPanelProps {
  citations: AgentCitation[];
}

export function CitationPanel({ citations }: CitationPanelProps) {
  return (
    <aside className="agent-panel" aria-label="Citations">
      <header className="agent-panel__header">
        <h2>Citations</h2>
      </header>
      <div className="citation-list">
        {citations.length === 0 ? (
          <p className="citation-list__empty">No citations yet</p>
        ) : (
          citations.map((citation) => (
            <article className="citation" key={`${citation.documentId}-${citation.chunkId}`}>
              <header>
                <strong>{String(citation.metadata.sectionTitle ?? 'Document')}</strong>
                <span>{citation.chunkId}</span>
              </header>
              <p>{citation.content}</p>
              <footer>{citation.documentId}</footer>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
