'use client';

import { useMemo } from 'react';
import { useWorkbenchStore } from '@/store/workbench.store';

export function IngestionPanel() {
  const documents = useWorkbenchStore((state) => state.documents);
  const ingestSelectedDocument = useWorkbenchStore((state) => state.ingestSelectedDocument);
  const ingestionState = useWorkbenchStore((state) => state.ingestionState);
  const ingestionStatus = useWorkbenchStore((state) => state.ingestionStatus);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );
  const result = ingestionState.result;

  return (
    <section className="workbench-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Ingestion</h2>
          <span>force · embedding · no graph</span>
        </div>
        <span className={`status-pill status-pill--${ingestionState.status}`}>
          {ingestionState.status}
        </span>
      </div>

      <div className="ingestion-summary">
        <div>
          <span>Document</span>
          <strong>{selectedDocument?.title ?? '-'}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{ingestionStatus?.documentStatus ?? selectedDocument?.status ?? '-'}</strong>
        </div>
        <div>
          <span>Chunks</span>
          <strong>{ingestionStatus?.chunkCount ?? result?.counts.chunks ?? '-'}</strong>
        </div>
        <div>
          <span>Embeddings</span>
          <strong>{ingestionStatus?.embeddingCount ?? result?.counts.embeddings ?? '-'}</strong>
        </div>
      </div>

      <button
        className="workbench-button"
        disabled={!selectedDocument || ingestionState.status === 'running'}
        onClick={() => void ingestSelectedDocument()}
        type="button"
      >
        Run Ingestion
      </button>
    </section>
  );
}
