'use client';

import { useMemo } from 'react';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { DocumentStatus, KnowledgeDocument } from '@/types/workbench';

const statusLabels: Record<DocumentStatus, string> = {
  ARCHIVED: 'Archived',
  CREATED: 'Created',
  FAILED: 'Failed',
  PROCESSING: 'Processing',
  READY: 'Ready',
};

const formatSize = (size: number | null): string => {
  if (!size) {
    return '-';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const getDocumentSubtitle = (document: KnowledgeDocument): string =>
  [document.type, formatSize(document.size), new Date(document.updatedAt).toLocaleString()]
    .filter(Boolean)
    .join(' · ');

export function DocumentListPanel() {
  const deleteSelectedDocument = useWorkbenchStore((state) => state.deleteSelectedDocument);
  const documents = useWorkbenchStore((state) => state.documents);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectDocument = useWorkbenchStore((state) => state.selectDocument);
  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const handleDelete = async () => {
    if (!selectedDocument) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedDocument.title}?`);

    if (confirmed) {
      await deleteSelectedDocument();
    }
  };

  return (
    <section className="workbench-panel document-list-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Documents</h2>
          <span>{documents.length} total</span>
        </div>
        <button
          className="workbench-button workbench-button--danger"
          disabled={!selectedDocument || loadingDocuments}
          onClick={handleDelete}
          type="button"
        >
          Delete
        </button>
      </div>

      <div className="document-list">
        {!selectedSpaceId ? <p className="workbench-empty">No space selected.</p> : null}
        {selectedSpaceId && loadingDocuments ? (
          <p className="workbench-empty">Loading documents...</p>
        ) : null}
        {selectedSpaceId && !loadingDocuments && documents.length === 0 ? (
          <p className="workbench-empty">No documents.</p>
        ) : null}

        {documents.map((document) => (
          <button
            className={`document-row ${
              document.id === selectedDocumentId ? 'document-row--active' : ''
            }`}
            key={document.id}
            onClick={() => void selectDocument(document.id)}
            type="button"
          >
            <span className="document-row__title">{document.title}</span>
            <span className="document-row__meta">{getDocumentSubtitle(document)}</span>
            <span className={`status-pill status-pill--${document.status.toLowerCase()}`}>
              {statusLabels[document.status]}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
