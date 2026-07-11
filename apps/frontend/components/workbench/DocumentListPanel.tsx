'use client';

import { useMemo } from 'react';
import { DemoEmptyState } from '@/components/demo';
import { documentStatusDescriptions, documentStatusLabels } from '@/lib/workbench-copy';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { KnowledgeDocument } from '@/types/workbench';

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
    .join(' | ');

export function DocumentListPanel() {
  const deleteSelectedDocument = useWorkbenchStore((state) => state.deleteSelectedDocument);
  const documents = useWorkbenchStore((state) => state.documents);
  const loadingDocuments = useWorkbenchStore((state) => state.loadingDocuments);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedDocumentIds = useWorkbenchStore((state) => state.selectedDocumentIds);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const selectDocument = useWorkbenchStore((state) => state.selectDocument);
  const toggleDocumentSelection = useWorkbenchStore((state) => state.toggleDocumentSelection);
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
        {!selectedSpaceId ? (
          <DemoEmptyState title="No Space selected" action="Create or select a Space first." />
        ) : null}
        {selectedSpaceId && loadingDocuments ? (
          <p className="workbench-empty">Loading documents...</p>
        ) : null}
        {selectedSpaceId && !loadingDocuments && documents.length === 0 ? (
          <DemoEmptyState title="No Documents" action="Upload docs/demo/sample-policy.md." />
        ) : null}

        {documents.map((document) => (
          <div
            className={`document-row ${
              document.id === selectedDocumentId ? 'document-row--active' : ''
            }`}
            key={document.id}
          >
            <div className="document-row__head">
              <label className="document-row__select" onClick={(event) => event.stopPropagation()}>
                <input
                  checked={selectedDocumentIds.includes(document.id)}
                  onChange={() => toggleDocumentSelection(document.id)}
                  type="checkbox"
                />
              </label>
              <button
                className="document-row__open"
                onClick={() => void selectDocument(document.id)}
                type="button"
              >
                <span className="document-row__title">{document.title}</span>
              </button>
            </div>
            <span className="document-row__meta">{getDocumentSubtitle(document)}</span>
            <span className={`status-pill status-pill--${document.status.toLowerCase()}`}>
              {documentStatusLabels[document.status]}
            </span>
            <span className="document-row__meta">
              {documentStatusDescriptions[document.status]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
