'use client';

import { useMemo } from 'react';
import { documentStatusLabels, ingestionStateLabels } from '@/lib/workbench-copy';
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
  const documentStatus = ingestionStatus?.documentStatus ?? selectedDocument?.status;

  return (
    <section className="workbench-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Ingestion</h2>
          <span>强制重建 | 向量化 | 默认跳过图谱</span>
        </div>
        <span className={`status-pill status-pill--${ingestionState.status}`}>
          {ingestionStateLabels[ingestionState.status]}
        </span>
      </div>

      <div className="ingestion-summary">
        <div>
          <span>Document</span>
          <strong>{selectedDocument?.title ?? '-'}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{documentStatus ? documentStatusLabels[documentStatus] : '-'}</strong>
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

      {ingestionState.errorMessage ? (
        <p className="workbench-error workbench-error--inline">{ingestionState.errorMessage}</p>
      ) : null}

      <button
        className="workbench-button"
        disabled={!selectedDocument || ingestionState.status === 'running'}
        onClick={() => void ingestSelectedDocument()}
        type="button"
      >
        {ingestionState.status === 'running' ? '处理中...' : '开始解析入库'}
      </button>
    </section>
  );
}
