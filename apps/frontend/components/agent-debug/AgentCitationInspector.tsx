'use client';

import type { AgentCitation } from '@/types/agent';

interface AgentCitationInspectorProps {
  citations: AgentCitation[];
}

const excerpt = (content: string): string =>
  content.length > 220 ? `${content.slice(0, 220)}...` : content;

export function AgentCitationInspector({ citations }: AgentCitationInspectorProps) {
  return (
    <section className="workbench-panel agent-debug-citation-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Citations</h2>
          <span>{citations.length} sources</span>
        </div>
      </div>

      {citations.length === 0 ? <p className="workbench-empty">No citations.</p> : null}

      <div className="agent-debug-citations">
        {citations.map((citation) => (
          <article
            className="agent-debug-citation"
            key={`${citation.documentId}-${citation.chunkId}`}
          >
            <header>
              <strong>{String(citation.metadata.sectionTitle ?? 'Document')}</strong>
              <span>{citation.score.toFixed(4)}</span>
            </header>
            <p>{excerpt(citation.content)}</p>
            <footer>
              <span>{citation.documentId}</span>
              <span>{citation.chunkId}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
